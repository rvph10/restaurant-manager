import {
  PrismaClient,
  Prisma,
  Menu,
  MenuItem,
  MenuGroup,
  MenuFixedItem,
  MenuType,
  Weekday,
} from '@prisma/client';
import { prisma } from '../prisma/client';
import { logger, auditLog } from '../lib/logging/logger';
import { MenuDataInput } from '../interfaces/menu.interface';
import {
  hasValidLength,
  isDateRangeValid,
  isPositiveNumber,
  isValidEmail,
  isValidPhoneNumber,
  isValidUUID,
} from '../utils/valid';

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

export class MenuService {
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
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      switch (prismaError.code) {
        case 'P2002':
          throw new DuplicateResourceError('A record with this value already exists');
        case 'P2025':
          throw new ResourceNotFoundError('Record not found');
        case 'P2003':
          throw new ValidationError('Invalid relationship reference');
        case 'P2014':
          throw new ValidationError('Invalid data provided');
        default:
          throw new ProductServiceError(`Database error: ${prismaError.message}`);
      }
    }

    throw new ProductServiceError('An unexpected error occurred');
  }

  private async validateMenuData(data: MenuDataInput): Promise<void> {
    if (!hasValidLength(data.name, 1, 50)) {
      throw new ValidationError('Menu name must be between 1 and 50 characters');
    }

    if (data.startDate && data.endDate && !isDateRangeValid(data.startDate, data.endDate)) {
      throw new ValidationError('Invalid date range');
    }

    if (!data.type || !Object.values(MenuType).includes(data.type)) {
      throw new ValidationError('Invalid menu type');
    }

    if (data.isActive === undefined) {
      throw new ValidationError('isActive is required');
    }

    if (data.startDate && !(data.startDate instanceof Date)) {
      throw new ValidationError('Invalid start date');
    }

    if (data.endDate && !(data.endDate instanceof Date)) {
      throw new ValidationError('Invalid end date');
    }

    if (data.startTime && !hasValidLength(data.startTime, 1, 5)) {
      throw new ValidationError('Invalid start time');
    }

    if (data.endTime && !hasValidLength(data.endTime, 1, 5)) {
      throw new ValidationError('Invalid end time');
    }

    if (data.daysOfWeek && !Array.isArray(data.daysOfWeek)) {
      throw new ValidationError('Invalid days of week');
    }

    if (data.items && !Array.isArray(data.items)) {
      throw new ValidationError('Invalid items');
    }

    if (data.groups && !Array.isArray(data.groups)) {
      throw new ValidationError('Invalid groups');
    }

    if (data.fixedItems && !Array.isArray(data.fixedItems)) {
      throw new ValidationError('Invalid fixed items');
    }

    if (data.items) {
      for (const item of data.items) {
        if (!isValidUUID(item.productId)) {
          throw new ValidationError('Invalid product ID');
        }

        if (!item.itemType || !hasValidLength(item.itemType, 1, 255)) {
          throw new ValidationError('Invalid item type');
        }

        if (item.isRequired === undefined) {
          throw new ValidationError('isRequired is required');
        }

        if (!isPositiveNumber(item.maxQuantity)) {
          throw new ValidationError('Invalid max quantity');
        }

        if (!isPositiveNumber(item.sequence)) {
          throw new ValidationError('Invalid sequence');
        }

        if (!isPositiveNumber(item.specialPrice)) {
          throw new ValidationError('Invalid special price');
        }
      }
    }
    if (data.groups) {
      for (const group of data.groups) {
        if (!hasValidLength(group.name, 1, 255)) {
          throw new ValidationError('Invalid group name');
        }
        if (!isPositiveNumber(group.minSelect)) {
          throw new ValidationError('Invalid min select');
        }
        if (!isPositiveNumber(group.maxSelect)) {
          throw new ValidationError('Invalid max select');
        }
        if (group.description && !hasValidLength(group.description, 1, 255)) {
          throw new ValidationError('Invalid description');
        }
        if (!isPositiveNumber(group.sequence)) {
          throw new ValidationError('Invalid sequence');
        }
        if (!hasValidLength(group.products, 1, 255)) {
          throw new ValidationError('Invalid products');
        }
        if (group.isRequired === undefined) {
          throw new ValidationError('isRequired is required');
        }
        if (group.products) {
          const products = group.products.split(',');
          for (const product of products) {
            if (!isValidUUID(product)) {
              throw new ValidationError('Invalid product ID');
            }
          }
        }
      }
    }

    if (data.fixedItems) {
      for (const fixedItem of data.fixedItems) {
        if (!isValidUUID(fixedItem.productId)) {
          throw new ValidationError('Invalid product ID');
        }

        if (!isPositiveNumber(fixedItem.quantity)) {
          throw new ValidationError('Invalid quantity');
        }

        if (!isPositiveNumber(fixedItem.sequence)) {
          throw new ValidationError('Invalid sequence');
        }

        if (fixedItem.description && !hasValidLength(fixedItem.description, 1, 255)) {
          throw new ValidationError('Invalid description');
        }

        if (fixedItem.fixedOptions && !Array.isArray(fixedItem.fixedOptions)) {
          throw new ValidationError('Invalid fixed options');
        }
      }
    }
  }

  async createMenu(data: MenuDataInput): Promise<Menu> {
    try {
      await this.validateMenuData(data);

      return await prisma.$transaction(async (tx) => {
        // Create the base menu
        const menu = await tx.menu.create({
          data: {
            name: data.name,
            description: data.description,
            type: data.type,
            isActive: data.isActive,
            startDate: data.startDate,
            endDate: data.endDate,
            startTime: data.startTime,
            endTime: data.endTime,
            daysOfWeek: data.daysOfWeek,
            basePrice: data.basePrice ? new Prisma.Decimal(data.basePrice) : null,
          },
        });

        // Create or assign menu items
        if (data.items) {
          await tx.menuItem.createMany({
            data: data.items.map((item) => ({
              menuId: menu.id,
              productId: item.productId,
              itemType: item.itemType,
              isRequired: item.isRequired,
              maxQuantity: item.maxQuantity,
              sequence: item.sequence,
              specialPrice: item.specialPrice ? new Prisma.Decimal(item.specialPrice) : null,
            })),
          });
        }

        // Create menu groups and their products
        if (data.groups) {
          for (const group of data.groups) {
            const menuGroup = await tx.menuGroup.create({
              data: {
                menuId: menu.id,
                name: group.name,
                minSelect: group.minSelect,
                maxSelect: group.maxSelect,
                sequence: group.sequence,
                isRequired: group.isRequired,
                description: group.description,
              },
            });

            // Create group products
            if (group.products) {
              const productIds = group.products.split(',');
              await tx.menuGroupProduct.createMany({
                data: productIds.map((productId, index) => ({
                  groupId: menuGroup.id,
                  productId: productId.trim(),
                  sequence: index,
                  overrideOptions: group.overrideOptions
                    ? (group.overrideOptions as Prisma.InputJsonValue)
                    : (Prisma.JsonNull as Prisma.NullableJsonNullValueInput),
                  maxQuantity: group.productMaxQuantity,
                  specialPrice: group.productSpecialPrice
                    ? new Prisma.Decimal(group.productSpecialPrice)
                    : null,
                })),
              });
            }
          }
        }

        // Create fixed items
        if (data.fixedItems) {
          await tx.menuFixedItem.createMany({
            data: data.fixedItems.map((item) => ({
              menuId: menu.id,
              productId: item.productId,
              quantity: item.quantity,
              sequence: item.sequence,
              description: item.description,
              fixedOptions: item.fixedOptions
                ? (item.fixedOptions as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            })),
          });
        }

        await auditLog(
          'CREATE_MENU',
          {
            menuId: menu.id,
            menuName: menu.name,
            menuType: menu.type,
          },
          data.user || 'SYSTEM'
        );

        return menu;
      });
    } catch (error) {
      return this.handleServiceError(error, 'createMenu');
    }
  }

  public async getMenus(filters?: {
    isActive?: boolean;
    type?: MenuType;
    isAvailable?: boolean;
    isDayOfWeek?: Weekday;
    page?: number;
    limit?: number;
  }): Promise<{ data: Menu[]; total: number; pages: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      // Initialize empty where clause
      const whereClause: Prisma.MenuWhereInput = {};

      // Only add filters if explicitly provided
      if (filters?.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      if (filters?.isDayOfWeek && Object.values(Weekday).includes(filters.isDayOfWeek)) {
        whereClause.daysOfWeek = { has: filters.isDayOfWeek };
      }

      if (filters?.isAvailable !== undefined) {
        whereClause.isAvailable = filters.isAvailable;
      }

      if (filters?.type) {
        whereClause.type = filters.type;
      }

      // Add logging to debug
      logger.info('Query parameters:', {
        whereClause,
        skip,
        limit,
      });

      const [menus, total] = await prisma.$transaction([
        prisma.menu.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            items: {
              include: {
                product: true,
              },
            },
            groups: {
              include: {
                products: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            fixedItems: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.menu.count({ where: whereClause }),
      ]);

      return {
        data: menus,
        total,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      return this.handleServiceError(error, 'getMenus');
    }
  }

  async getMenu(id: string): Promise<Menu> {
    try {
      const menu = await prisma.menu.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          groups: {
            include: {
              products: {
                include: {
                  product: true,
                },
              },
            },
          },
          fixedItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!menu) {
        throw new ResourceNotFoundError('Menu not found');
      }

      return menu;
    } catch (error) {
      return this.handleServiceError(error, 'getMenu');
    }
  }

  async updateMenu(id: string, data: Partial<MenuDataInput>): Promise<Menu> {
    try {
      const existingMenu = await this.getMenu(id);
      if (!existingMenu) {
        throw new ResourceNotFoundError('Menu not found');
      }

      return await prisma.$transaction(async (tx) => {
        // Update base menu
        const menu = await tx.menu.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            type: data.type,
            isActive: data.isActive,
            isAvailable: data.isAvailable,
            startDate: data.startDate,
            endDate: data.endDate,
            startTime: data.startTime,
            endTime: data.endTime,
            daysOfWeek: data.daysOfWeek,
            basePrice: data.basePrice ? new Prisma.Decimal(data.basePrice) : undefined,
          },
        });

        // Update items if provided
        if (data.items) {
          // Delete existing items
          await tx.menuItem.deleteMany({
            where: { menuId: id },
          });

          // Create new items
          await tx.menuItem.createMany({
            data: data.items.map((item) => ({
              menuId: menu.id,
              productId: item.productId,
              itemType: item.itemType,
              isRequired: item.isRequired,
              maxQuantity: item.maxQuantity,
              sequence: item.sequence,
              specialPrice: item.specialPrice ? new Prisma.Decimal(item.specialPrice) : null,
            })),
          });
        }

        // Update groups if provided
        if (data.groups) {
          // Delete existing groups and their products
          const existingGroups = await tx.menuGroup.findMany({
            where: { menuId: id },
          });

          for (const group of existingGroups) {
            await tx.menuGroupProduct.deleteMany({
              where: { groupId: group.id },
            });
          }

          await tx.menuGroup.deleteMany({
            where: { menuId: id },
          });

          // Create new groups and their products
          for (const group of data.groups) {
            const menuGroup = await tx.menuGroup.create({
              data: {
                menuId: menu.id,
                name: group.name,
                minSelect: group.minSelect,
                maxSelect: group.maxSelect,
                sequence: group.sequence,
                isRequired: group.isRequired,
                description: group.description,
              },
            });

            if (group.products) {
              const productIds = group.products.split(',');
              await tx.menuGroupProduct.createMany({
                data: productIds.map((productId, index) => ({
                  groupId: menuGroup.id,
                  productId: productId.trim(),
                  sequence: index,
                  overrideOptions: group.overrideOptions
                    ? (group.overrideOptions as Prisma.InputJsonValue)
                    : (Prisma.JsonNull as Prisma.NullableJsonNullValueInput),
                  maxQuantity: group.productMaxQuantity,
                  specialPrice: group.productSpecialPrice
                    ? new Prisma.Decimal(group.productSpecialPrice)
                    : null,
                })),
              });
            }
          }
        }

        // Update fixed items if provided
        if (data.fixedItems) {
          // Delete existing fixed items
          await tx.menuFixedItem.deleteMany({
            where: { menuId: id },
          });

          // Create new fixed items
          await tx.menuFixedItem.createMany({
            data: data.fixedItems.map((item) => ({
              menuId: menu.id,
              productId: item.productId,
              quantity: item.quantity,
              sequence: item.sequence,
              description: item.description,
              fixedOptions: item.fixedOptions
                ? (item.fixedOptions as Prisma.InputJsonValue)
                : (Prisma.JsonNull as Prisma.NullableJsonNullValueInput),
            })),
          });
        }

        await auditLog(
          'UPDATE_MENU',
          {
            menuId: menu.id,
            menuName: menu.name,
            menuType: menu.type,
          },
          data.user || 'SYSTEM'
        );

        return this.getMenu(menu.id);
      });
    } catch (error) {
      return this.handleServiceError(error, 'updateMenu');
    }
  }

  async deleteMenu(id: string, user: string): Promise<void> {
    try {
      const menu = await this.getMenu(id);
      if (!menu) {
        throw new ResourceNotFoundError('Menu not found');
      }

      await prisma.$transaction(async (tx) => {
        // Delete menu items
        await tx.menuItem.deleteMany({
          where: { menuId: id },
        });

        // Delete menu groups and their products
        const groups = await tx.menuGroup.findMany({
          where: { menuId: id },
        });

        for (const group of groups) {
          await tx.menuGroupProduct.deleteMany({
            where: { groupId: group.id },
          });
        }

        await tx.menuGroup.deleteMany({
          where: { menuId: id },
        });

        // Delete fixed items
        await tx.menuFixedItem.deleteMany({
          where: { menuId: id },
        });

        // Delete the menu
        await tx.menu.delete({
          where: { id },
        });

        await auditLog(
          'DELETE_MENU',
          {
            menuId: id,
            menuName: menu.name,
            menuType: menu.type,
          },
          user
        );
      });
    } catch (error) {
      return this.handleServiceError(error, 'deleteMenu');
    }
  }
}
