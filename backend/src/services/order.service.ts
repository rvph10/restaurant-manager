import { Order, OrderStatus, OrderType, Prisma, PrismaClient, Product } from '@prisma/client';
import { redisManager } from '../lib/redis/redis.manager';
import {
  CachedProduct,
  OrderItemDataInput,
  removeDataInput,
  StationDataInput,
  StepItemDataInput,
  WorkflowStepDataInput,
} from '../interfaces/order.interface';
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
        if (
          (await prisma.customerAddress.findUnique({ where: { id: data.customerId } })) !== null
        ) {
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
        if (data.customerId === null) throw new MissingParameterError('Customer ID is required');
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
            parent: true,
          },
        });

        if (category) {
          // Add parent if exists
          if (category.parentId) {
            allCategories.add(category.parentId);
          }

          // Process children recursively
          if (category.children.length > 0) {
            const childIds = category.children.map((child) => child.id);
            await fetchCategories(childIds);
          }
        }
      }
    };

    await fetchCategories(categoryIds);
    return Array.from(allCategories);
  }

  private async checkOrderItemData(
    station: StationDataInput,
    item: OrderItemDataInput
  ): Promise<boolean> {
    try {
      // Get the product and its category
      const product = await this.getProductWithCache(item.productId);

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
        error,
      });
      throw error;
    }
  }

  private async checkIngredientInProduct(
    product: OrderItemDataInput,
    removeIngredient: removeDataInput[]
  ): Promise<removeDataInput[]> {
    const ele = await this.getProductWithCache(product.productId);

    if (!ele || !ele.ingredients) {
      throw new ResourceNotFoundError(
        `Product or ingredients not found for ID: ${product.productId}`
      );
    }

    const validRemovedIngredients: removeDataInput[] = [];

    for (const ingredient of removeIngredient) {
      const isIngredientInProduct = ele.ingredients.some(
        (productIngredient) => productIngredient.ingredientId === ingredient.id
      );
      if (isIngredientInProduct) {
        validRemovedIngredients.push(ingredient);
      } else {
        logger.warn(`Ingredient not found in product: ${ingredient.id}`);
      }
    }

    return validRemovedIngredients;
  }

  private cleanModifications(modifications: any) {
    if (!modifications) return { added: [], removed: [] };

    return {
      added:
        modifications.added?.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
        })) || [],
      removed: modifications.removed || [],
    };
  }

  private sortStations(stations: StationDataInput[]): StationDataInput[] {
    const independentStations = stations.filter(station => station.isIndependent);
    const dependentStations = stations.filter(station => !station.isIndependent);

    const sortedDependentStations = dependentStations.sort((a, b) => {
      const orderA = a.stepOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.stepOrder ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    return [...independentStations, ...sortedDependentStations];
  }

  private async createWorkflowSteps(data: OrderDataInput): Promise<WorkflowStepDataInput[]> {
    const steps: WorkflowStepDataInput[] = [];
    const unsortedStations = await this.kitchenService.getStations();
    const stations = this.sortStations(unsortedStations);
    for (const station of stations) {
      const stepItem: StepItemDataInput[] = [];
      for (const item of data.items) {
        if (await this.checkOrderItemData(station, item)) {
          const product = await this.getProductWithCache(item.productId);

          if (!product) {
            logger.warn(`Product not found for ID: ${item.productId}`);
            continue;
          }
          const cleanModifications = this.cleanModifications(item.modifications);
          if (cleanModifications?.removed && cleanModifications.removed.length > 0) {
            cleanModifications.removed = await this.checkIngredientInProduct(
              item,
              cleanModifications.removed
            );
          }

          const step: StepItemDataInput = {
            name: product.name,
            quantity: item.quantity,
            id: item.productId,
            added: cleanModifications.added || [],
            removed: cleanModifications.removed || [],
          };
          stepItem.push(step);
        }
      }
      if (stepItem.length > 0) {
        const step: WorkflowStepDataInput = {
          stationName: station.name,
          stepOrder: station.stepOrder ?? -1,
          isParallel: station.isParallel || false,
          item: stepItem,
        };
        steps.push(step);
      }
    }
    return steps;
  }

  private async getProductWithCache(productId: string): Promise<CachedProduct | null> {
    try {
      const cacheKey = `product:${productId}`;
      const cached = await redisManager.get(cacheKey);

      if (cached) {
        logger.debug('Product cache hit', { productId });
        return cached as CachedProduct; // Type assertion since Redis returns any
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (product) {
        const cachedProduct = product as unknown as CachedProduct;
        await redisManager.set(cacheKey, cachedProduct, 3600);
        logger.debug('Product cached', { productId });
        return cachedProduct;
      }

      return null;
    } catch (error) {
      logger.error('Error getting product with cache:', error);
      throw error;
    }
  }

  private async updateIngredientStock(items: OrderItemDataInput[]): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const product = await this.getProductWithCache(item.productId);
          if (!product || !product.ingredients) {
            throw new ResourceNotFoundError(
              `Product ${item.productId} or its ingredients not found`
            );
          }

          // Process each ingredient
          for (const productIngredient of product.ingredients) {
            // Calculate quantity needed with proper decimal handling
            const requiredQuantity = new Prisma.Decimal(productIngredient.quantity)
              .mul(new Prisma.Decimal(item.quantity))
              .toNumber();

            logger.debug(`Processing ingredient stock update`, {
              ingredientName: productIngredient.ingredient.name,
              ingredientId: productIngredient.ingredientId,
              currentStock: productIngredient.ingredient.stock,
              requiredQuantity,
              productId: item.productId,
            });

            // Update ingredient stock
            const updatedIngredient = await tx.ingredient.update({
              where: { id: productIngredient.ingredientId },
              data: {
                stock: {
                  decrement: requiredQuantity,
                },
              },
            });

            // Create stock movement log
            await tx.ingredientStockLog.create({
              data: {
                ingredientId: productIngredient.ingredientId,
                quantity: -requiredQuantity,
                type: 'USAGE',
                reason: `Order Usage - Product: ${product.name}`,
                performedBy: 'SYSTEM',
              },
            });

            // Check if reorder point is reached - using proper decimal comparison
            const currentStock = new Prisma.Decimal(updatedIngredient.stock);
            const reorderPoint = new Prisma.Decimal(updatedIngredient.reorderPoint);

            if (currentStock.lessThanOrEqualTo(reorderPoint)) {
              logger.warn(`Low stock alert for ingredient ${updatedIngredient.name}`, {
                currentStock: currentStock.toString(),
                reorderPoint: reorderPoint.toString(),
                ingredientId: updatedIngredient.id,
                productId: product.id,
              });
            }
          }
        }
      });
    } catch (error) {
      logger.error('Failed to update ingredient stock:', error);
      throw error;
    }
  }

  private async calculateTotalAmount(items: OrderItemDataInput[]): Promise<number> {
    try {
      let total = 0;

      for (const item of items) {
        // Get product base price
        const product = await this.getProductWithCache(item.productId);

        if (!product) {
          throw new ResourceNotFoundError(`Product ${item.productId} not found`);
        }

        // Calculate base cost (product price * quantity)
        let itemTotal = Number(product.price) * item.quantity;

        // Add extra price if any
        if (item.extraPrice) {
          itemTotal += Number(item.extraPrice);
        }

        // Add costs for added ingredients/modifications
        if (item.modifications?.added) {
          for (const addition of item.modifications.added) {
            const ingredient = await prisma.ingredient.findUnique({
              where: { id: addition.id },
            });

            if (ingredient && ingredient.isExtra && ingredient.extraPrice) {
              itemTotal += Number(ingredient.extraPrice) * addition.quantity;
            }
          }
        }

        total += itemTotal;
      }

      // Round to 2 decimal places
      return Number(total.toFixed(2));
    } catch (error) {
      logger.error('Error calculating total amount:', error);
      throw error;
    }
  }

  async createOrder(data: OrderDataInput): Promise<Order> {
    await this.checkOrderTypeData(data);
    const orderNumber = await this.createOrderNumber();
    const workflowSteps = await this.createWorkflowSteps(data);
    if (!data.totalAmount) {
      data.totalAmount = await this.calculateTotalAmount(data.items);
    }
    // Wrap everything in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: orderNumber.toString(),
          customerId: data.customerId || undefined,
          orderName: data.orderName,
          type: data.type,
          status: OrderStatus.PENDING,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice || 0,
              modifications: item.modifications,
              extraPrice: item.extraPrice,
              specialRequests: item.specialRequest || null,
              status: item.status,
            })),
          },
          totalAmount: data.totalAmount,
          tax: data.tax || 0,
          discount: data.discount,
          deliveryFee: data.deliveryFee,
          tableId: data.tableId,
          notes: data.notes,
          workflows: workflowSteps as any,
        },
      });
      await this.updateIngredientStock(data.items);
      if (data.customerId !== null) {
      } // Update customer loyalty points + add order to customer history

      return createdOrder;
    });

    return order;
  }
}
