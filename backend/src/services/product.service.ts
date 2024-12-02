import { prisma } from '../prisma/client';
import {
  Prisma,
  Product,
  Category,
  Ingredient,
  MeasurementUnit,
  IngredientCategory,
} from '@prisma/client';
import { logger } from '../lib/logging/logger';
import { CreateIngredientInput } from '../interfaces/product.interface';
import { auditLog } from '../lib/logging/logger';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductService {
  private handleServiceError(error: unknown, context: string): never {
    logger.error(`Error in ProductService.${context}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new Error('A record with this value already exists');
        case 'P2025':
          throw new Error('Record not found');
        case 'P2003':
          throw new Error('Foreign key constraint failed');
        case 'P2014':
          throw new Error('The provided data is invalid');
        default:
          throw new Error(`Database error: ${error.message}`);
      }
    }

    if (error instanceof Error) {
      return this.handleServiceError(error, 'handleServiceError');
    }

    throw new Error('An unexpected error occurred');
  }

  async checkSupplierExists(supplierId: string): Promise<boolean> {
    try {
      if (!supplierId) {
        throw new Error('Supplier ID must be provided');
      }
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });

      return !!supplier;
    } catch (error) {
      return this.handleServiceError(error, 'checkSupplierExists');
    }
  }

  async checkIngredientExists(params: { id?: string; name?: string }): Promise<boolean> {
    try {
      if (!params.id && !params.name) {
        throw new Error('At least one parameter (id or name) must be provided');
      }

      const whereClause: Prisma.IngredientWhereInput = {
        OR: [],
      };

      if (params.id) {
        whereClause.OR!.push({ id: params.id });
      }
      if (params.name) {
        whereClause.OR!.push({
          name: {
            equals: params.name,
            mode: 'insensitive', // Case insensitive search
          },
        });
      }

      const ingredient = await prisma.ingredient.findFirst({
        where: whereClause,
      });

      return !!ingredient;
    } catch (error) {
      return this.handleServiceError(error, 'checkIngredientExists');
    }
  }

  async createIngredient(data: CreateIngredientInput): Promise<Ingredient> {
    try {
      if (data.cost < 0) {
        throw new Error('Cost must be a positive number');
      }
      if (!Object.values(IngredientCategory).includes(data.category)) {
        throw new Error('Invalid category');
      }
      if (data.stock < 0) {
        throw new Error('Stock must be a positive number');
      }

      if (data.reorderPoint < 0) {
        throw new Error('Reorder point must be a positive number');
      }

      if (data.reorderAmount < 0) {
        throw new Error('Reorder amount must be a positive number');
      }

      if (data.isExtra && !data.extraPrice) {
        throw new Error('Extra price must be provided for extra ingredients');
      }

      if (!data.isExtra && data.extraPrice) {
        throw new Error('Extra price can only be provided for extra ingredients');
      }

      if (data.isExtra && (data.extraPrice ?? 0) < 0) {
        throw new Error('Extra price must be a positive number');
      }

      if (data.supplierId && !(await this.checkSupplierExists(data.supplierId))) {
        throw new Error('Supplier with this ID does not exist');
      }

      if (await this.checkIngredientExists({ name: data.name })) {
        throw new Error('Ingredient with this name already exists');
      }

      const ingredient = await prisma.ingredient.create({
        data: {
          name: data.name,
          description: data.description,
          stock: data.stock,
          unit: data.unit as MeasurementUnit,
          category: data.category as IngredientCategory,
          reorderPoint: data.reorderPoint,
          reorderAmount: new Decimal(data.reorderAmount || 0),
          cost: data.cost,
          isExtra: data.isExtra,
          extraPrice: data.extraPrice,
          supplierId: data.supplierId,
        },
      });

      auditLog(
        'CREATE',
        {
          entityName: data.name,
          entityID: ingredient.id,
        },
        ingredient.id
      );

      return ingredient;
    } catch (error) {
      return this.handleServiceError(error, 'createIngredient');
    }
  }

  async updateIngredient(id: string, data: CreateIngredientInput): Promise<Ingredient> {
    try {
      if (data.cost < 0) {
        throw new Error('Cost must be a positive number');
      }
      if (!Object.values(IngredientCategory).includes(data.category)) {
        throw new Error('Invalid category');
      }
      if (data.stock < 0) {
        throw new Error('Stock must be a positive number');
      }

      if (data.reorderPoint < 0) {
        throw new Error('Reorder point must be a positive number');
      }

      if (data.reorderAmount < 0) {
        throw new Error('Reorder amount must be a positive number');
      }

      if (data.isExtra && !data.extraPrice) {
        throw new Error('Extra price must be provided for extra ingredients');
      }

      if (!data.isExtra && data.extraPrice) {
        throw new Error('Extra price can only be provided for extra ingredients');
      }

      if (data.isExtra && (data.extraPrice ?? 0) < 0) {
        throw new Error('Extra price must be a positive number');
      }

      if (data.supplierId && !(await this.checkSupplierExists(data.supplierId))) {
        throw new Error('Supplier with this ID does not exist');
      }

      const ingredient = await prisma.ingredient.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          stock: data.stock,
          unit: data.unit as MeasurementUnit,
          category: data.category as IngredientCategory,
          reorderPoint: data.reorderPoint,
          reorderAmount: new Decimal(data.reorderAmount || 0),
          cost: data.cost,
          isExtra: data.isExtra,
          extraPrice: data.extraPrice,
          supplierId: data.supplierId,
        },
      });

      auditLog(
        'UPDATE',
        {
          entityName: data.name,
          entityID: ingredient,
        },
        ingredient.id
      );

      return ingredient;
    } catch (error) {
      return this.handleServiceError(error, 'updateIngredient');
    }
  }
}
