import { prisma } from '../prisma/client';
import { Prisma, Product, Category, Ingredient, MeasurementUnit, IngredientCategory } from '@prisma/client';
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
    
    async createIngredient(data: CreateIngredientInput): Promise<Ingredient> {
        try {
        

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
    
          auditLog('CREATE', 'ingredient', ingredient.id);
    
          return ingredient;
        } catch (error) {
          return this.handleServiceError(error, 'createIngredient');
        }
      }

}