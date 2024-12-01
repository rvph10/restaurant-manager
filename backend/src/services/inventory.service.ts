import { prisma } from '../prisma/client';
import { Ingredient, MeasurementUnit } from '@prisma/client';
import { auditLog, logger } from '../lib/logging/logger';

export class InventoryService {
  async createIngredient(data: {
    user: string;
    name: string;
    description?: string | null;
    stock: number;
    unit: MeasurementUnit;
    reorderPoint: number;
    reorderAmount: number;
    cost: number;
    isExtra: boolean;
    extraPrice?: number | null;
    supplierId: string;
  }): Promise<Ingredient> {
    try {
      const ingredient = await prisma.ingredient.create({
        data: {
          name: data.name,
          description: data.description,
          stock: data.stock,
          unit: data.unit,
          reorderPoint: data.reorderPoint,
          reorderAmount: data.reorderAmount,
          cost: data.cost,
          isExtra: data.isExtra,
          extraPrice: data.extraPrice,
          supplierId: data.supplierId,
        },
      });

      await auditLog('CREATE_INGREDIENT', {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        action: 'Created new ingredient'
      }, data.user);

      return ingredient;
    } catch (error) {
      logger.error(`Error creating ingredient: ${error}`);
      throw error;
    }
  }
}