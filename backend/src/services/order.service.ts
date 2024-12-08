import { prisma } from '../prisma/client';
import { Order, Prisma, WorkflowStep } from '@prisma/client';
import { logger, auditLog } from '../lib/logging/logger';
import { createWorkflowStepsDataInput, OrderDataInput, OrderItemDataInput } from '../interfaces/order.interface';
import {
  hasValidLength,
  isPositiveNumber,
  isValidEmail,
  isValidPhoneNumber,
  isValidUUID,
} from '../utils/valid';
import { RedisKeyBuilder } from '../lib/redis/redis.utils';
import { CACHE_DURATIONS } from '../constants/cache';
import { redisManager } from '../lib/redis/redis.manager';
import { KitchenService } from './kitchen.service';
import { ProductService } from './product.service';

class ProductServiceError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

class ValidationError extends ProductServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

class MissingParameterError extends ProductServiceError {
  constructor(message: string) {
    super(message, 'MISSING_PARAMETER');
  }
}

class ResourceNotFoundError extends ProductServiceError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
  }
}

class DuplicateResourceError extends ProductServiceError {
  constructor(message: string) {
    super(message, 'DUPLICATE');
  }
}

export class OrderService {
  private kitchenService = new KitchenService();
  private productService = new ProductService();

  private handleServiceError(error: unknown, context: string): never {
    logger.error(`Error in ProductService.${context}:`, {
      error,
      timestamp: new Date().toISOString(),
      context,
    });

    // If it's already our custom error, just rethrow it
    if (error instanceof ProductServiceError) {
      throw error;
    }

    // If it's a normal Error, convert it to our custom error
    if (error instanceof Error) {
      throw new ValidationError(error.message);
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new DuplicateResourceError('A record with this value already exists');
        case 'P2025':
          throw new ResourceNotFoundError('Record not found');
        case 'P2003':
          throw new ValidationError('Invalid relationship reference');
        case 'P2014':
          throw new ValidationError('Invalid data provided');
        default:
          throw new ProductServiceError(`Database error: ${error.message}`);
      }
    }

    throw new ProductServiceError('An unexpected error occurred');
  }

  private async getOrderProducts(productIds: string[]): Promise<Record<string, any>> {
    try {
      const products: Record<string, any> = {};
      const missedIds: string[] = [];
      
      // Try to get products from cache first
      await Promise.all(
        productIds.map(async (id) => {
          const cacheKey = RedisKeyBuilder.product.detail(id);
          const cachedProduct = await redisManager.get(cacheKey);
          
          if (cachedProduct) {
            products[id] = cachedProduct;
          } else {
            missedIds.push(id);
          }
        })
      );
  
      // If any products weren't in cache, get them from database
      if (missedIds.length > 0) {
        const dbProducts = await prisma.product.findMany({
          where: {
            id: { in: missedIds },
          },
          include: {
            ingredients: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
  
        // Cache the products we got from database
        await Promise.all(
          dbProducts.map(async (product) => {
            const cacheKey = RedisKeyBuilder.product.detail(product.id);
            await redisManager.set(cacheKey, product, CACHE_DURATIONS.PRODUCTS);
            products[product.id] = product;
          })
        );
      }
  
      return products;
    } catch (error) {
      return this.handleServiceError(error, 'getOrderProducts');
    }
  }

  private validateOrderData(data: OrderDataInput): void {
    if (!data) {
      throw new MissingParameterError('Order data is required');
    }

    if (!hasValidLength(data.orderNumber, 1, 50)) {
      throw new ValidationError('Order number must be between 1 and 50 characters');
    }

    if (!isValidUUID(data.customerId)) {
      throw new ValidationError('Invalid customer ID');
    }

    if (!data.type) {
      throw new ValidationError('Order type is required');
    }
    
  }

  async createWorkflowSteps(data: createWorkflowStepsDataInput): Promise<WorkflowStep[]> {
    try {
      // Get all active stations
      const stations = await this.kitchenService.getStations();
      const steps: Prisma.WorkflowStepCreateManyInput[] = [];
      
      // Get all products for the order
      const products = await Promise.all(
        data.items.map((item) => this.productService.getProduct(item.productId))
      );
  
      // Group stations by product category
      for (const station of stations) {
        const stationProducts = products.filter(
          (product) => product && station.seenCategory.includes(product.categoryId)
        );
  
        if (stationProducts.length > 0) {
          // Create workflow step for this station
          steps.push({
            orderId: data.orderId,
            stations: [station.id],
            isParallel: station.isIndependent,
            status: 'PENDING',
            isIndependent: station.isIndependent
          });
        }
      }
  
      // Create all workflow steps in a transaction
      const createdSteps = await prisma.$transaction(
        steps.map((step) => 
          prisma.workflowStep.create({
            data: step
          })
        )
      );
  
      logger.info(`Created ${createdSteps.length} workflow steps for order ${data.orderId}`);
      return createdSteps;
  
    } catch (error) {
      return this.handleServiceError(error, 'createWorkflowSteps');
    }
  }


  async createOrder(data: OrderDataInput): Promise<Order> {
    try {
      this.validateOrderData(data);
  
      return await prisma.$transaction(async (tx) => {
        // 1. Get and validate products
        const productIds = data.items.map((item) => item.productId);
        const products = await this.getOrderProducts(productIds);
  
        const missingProducts = productIds.filter(id => !products[id]);
        if (missingProducts.length > 0) {
          throw new ValidationError(`Products not found: ${missingProducts.join(', ')}`);
        }
  
        // 2. Calculate totals
        let subtotal = 0;
        const orderItems: Prisma.OrderItemCreateManyInput[] = [];
  
        data.items.forEach(item => {
          const product = products[item.productId];
          const itemTotal = product.price * item.quantity;
          subtotal += itemTotal;
  
          orderItems.push({
            orderId: '',
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            modifications: item.modifications as Prisma.InputJsonValue | {},
            extraPrice: item.extraPrice,
            specialRequests: item.specialRequest,
            status: 'PENDING'
          });
        });
  
        // 3. Create order
        const order = await tx.order.create({
          data: {
            orderNumber: data.orderNumber,
            customerId: data.customerId,
            type: data.type,
            status: data.status,
            totalAmount: subtotal,
            tax: data.tax,
            discount: data.discount,
            deliveryFee: data.deliveryFee,
            tableId: data.tableId,
            notes: data.notes,
            items: {
              createMany: {
                data: orderItems
              }
            }
          },
          include: {
            items: true
          }
        });

        await tx.orderItem.updateMany({
          where: { orderId: '' },
          data: { orderId: order.id }
        });
  
        // 4. Create workflow steps
        await this.createWorkflowSteps({
          orderId: order.id,
          items: order.items.map(item => ({
            ...item,
            specialRequest: item.specialRequests
          }))
        });
  
        // 5. Log the order creation
        await auditLog(
          'CREATE_ORDER',
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            total: order.totalAmount
          },
          'SYSTEM'
        );
  
        return order;
      });
  
    } catch (error) {
      return this.handleServiceError(error, 'createOrder');
    }
  }
}
