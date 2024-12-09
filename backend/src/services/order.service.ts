import { Order, OrderType, PrismaClient } from '@prisma/client';
import { redisManager } from '../lib/redis/redis.manager';
import { OrderItemDataInput, StationDataInput, WorkflowStepDataInput } from '../interfaces/order.interface';
import { OrderDataInput } from '../interfaces/order.interface';
import { KitchenService } from './kitchen.service';
import { ProductService } from './product.service';
import { isValidUUID } from '../utils/valid';
import { logger } from '../lib/logging/logger';

const prisma = new PrismaClient();

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
  kitchenService = new KitchenService();
  productService = new ProductService();

  private async createOrderNumber(): Promise<number> {
    const redisKey = 'order:number';
    let orderNumber = await redisManager.get(redisKey);

    if (orderNumber === null) {
      // Fetch the last order number from the database
      const lastOrder = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });

      orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
    } else {
      orderNumber = parseInt(orderNumber, 10) + 1;
    }

    if (orderNumber > 500) {
      orderNumber = 0;
    }

    // Store the new order number in Redis
    await redisManager.set(redisKey, orderNumber);

    return orderNumber;
  }

  private validateOrderData(data: OrderDataInput): void {
    if (!data.customerId || !isValidUUID(data.customerId)) {
      throw new ValidationError('Valid customer ID is required');
    }
  
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Order must contain at least one item');
    }
  
    if (data.totalAmount <= 0) {
      throw new ValidationError('Total amount must be greater than zero');
    }
  
    if (data.tax < 0) {
      throw new ValidationError('Tax cannot be negative');
    }
  
    if (data.discount < 0) {
      throw new ValidationError('Discount cannot be negative');
    }
  
    if (data.tableId && !isValidUUID(data.tableId)) {
      throw new ValidationError('Invalid table ID format');
    }
  }

  private async checkOrderTypeData(data: OrderDataInput) {
    if (!Object.values(OrderType).includes(data.type)) {
      throw new ValidationError('Invalid order type');
    }

    switch (data.type) {
      case OrderType.DELIVERY:
        if (!data.deliveryFee) {
          throw new MissingParameterError('Delivery fee is required for delivery orders');
        }
        if (await prisma.customerAddress.findUnique({where: {id: data.customerId}}) !== null) {
          throw new ResourceNotFoundError('Customer address not found');
        }
        break;
      case OrderType.DINE_IN:
        if (!data.tableId) {
          throw new MissingParameterError('Table ID is required for dine-in orders');
        }
        // Check if the table exists
        break;
      case OrderType.TAKEAWAY:
        break;
      case OrderType.DRIVE_THRU:
        break;
    }
  }

  private async getAllStationCategoryPossible(categoryIds: string[]): Promise<string[]> {
    const allCategories: Set<string> = new Set();
  
    const fetchCategories = async (ids: string[]) => {
      for (const id of ids) {
        // Skip if we've already processed this category
        if (allCategories.has(id)) continue;
        
        // Add current category
        allCategories.add(id);
  
        const category = await prisma.category.findUnique({
          where: { id },
          include: { 
            children: true,
            parent: true 
          },
        });
  
        if (category) {
          // Add parent if exists
          if (category.parentId) {
            allCategories.add(category.parentId);
          }
  
          // Process children recursively
          if (category.children.length > 0) {
            const childIds = category.children.map(child => child.id);
            await fetchCategories(childIds);
          }
        }
      }
    };
  
    await fetchCategories(categoryIds);
    return Array.from(allCategories);
  }

  private async checkOrderItemData(station: StationDataInput, item: OrderItemDataInput): Promise<boolean> {
    try {
      // Get the product and its category
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          category: true
        }
      });
  
      if (!product) {
        throw new ValidationError(`Product not found: ${item.productId}`);
      }
  
      // Get all possible categories for the station
      const stationCategories = await this.getAllStationCategoryPossible(station.seenCategory);
      
      // Check if the product's category is in the station's category list
      return stationCategories.includes(product.categoryId);
  
    } catch (error) {
      logger.error('Error checking order item data:', {
        stationId: station.id,
        itemId: item.productId,
        error
      });
      throw error;
    }
  }

  private async createWorkflowSteps(data: OrderDataInput): Promise<WorkflowStepDataInput[]> {
  const steps: WorkflowStepDataInput[] = [];
  const stations = await this.kitchenService.getStations();
  logger.debug('Stations:', stations.toString());
  for (const item of data.items) {
    for (const station of stations) {
      if (await this.checkOrderItemData(station, item)) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          logger.warn(`Product not found for ID: ${item.productId}`);
          continue;
        }

        const step: WorkflowStepDataInput = {
          stationName: station.name,
          name: product.name,
          quantity: item.quantity,
          id: item.productId,
          added: item.modifications?.added || [],
          removed: item.modifications?.removed || []
        };

        steps.push(step);
      }
    }
  }
  
  steps.sort((a, b) => a.stationName.localeCompare(b.stationName));
  return steps;
}

  async createOrder(data: OrderDataInput): Promise<WorkflowStepDataInput[]>{
    await this.checkOrderTypeData(data);
    const orderNumber = await this.createOrderNumber();
    const workflowSteps = await this.createWorkflowSteps(data);
    console.log("neuille sucre: ", workflowSteps);
    // const order = await prisma.order.create({
    //   data: {
    //     orderNumber: orderNumber.toString(),
    //     customerId: data.customerId,
    //     type: data.type,
    //     status: data.status,
    //     totalAmount: data.totalAmount,
    //     tax: data.tax,
    //     discount: data.discount,
    //     deliveryFee: data.deliveryFee,
    //     tableId: data.tableId,
    //     notes: data.notes,
    //     items: {
    //       create: data.items.map(item => ({
    //         productId: item.productId,
    //         quantity: item.quantity,
    //         type: item.type,
    //         unitPrice: item.unitPrice,
    //         modifications: {
    //           create: {
    //             orderNumber,
    //             modifications: item.modifications,
    //           },
    //         },
    //         extraPrice: item.extraPrice,
    //         specialRequest: item.specialRequest,
    //         status: item.status,
    //       })),
    //     },
    //     workflowSteps: {
    //       create: workflowSteps,
    //     },
    //   },
    // });

    return workflowSteps;
  }
}
