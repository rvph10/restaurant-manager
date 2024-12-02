import { prisma } from '../prisma/client';
import { Ingredient, MeasurementUnit, Product, Category, IngredientStockLog } from '@prisma/client';
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

      await auditLog(
        'CREATE_INGREDIENT',
        {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          action: 'Created new ingredient',
        },
        data.user
      );

      return ingredient;
    } catch (error) {
      logger.error(`Error creating ingredient: ${error}`);
      throw error;
    }
  }

  async updateIngredient(data: {
    user: string;
    id: string;
    name?: string;
    description?: string | null;
    stock?: number;
    unit?: MeasurementUnit;
    reorderPoint?: number;
    reorderAmount?: number;
    cost?: number;
    isExtra?: boolean;
    extraPrice?: number | null;
    supplierId?: string;
  }): Promise<Ingredient | null> {
    try {
      const ingredient = await prisma.ingredient.update({
        where: { id: data.id },
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

      await auditLog(
        'UPDATE_INGREDIENT',
        {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          action: 'Updated ingredient',
        },
        data.user
      );

      return ingredient;
    } catch (error) {
      logger.error(`Error updating ingredient: ${error}`);
      throw error;
    }
  }

  async deleteIngredient(data: { user: string; id: string }): Promise<Ingredient> {
    try {
      const ingredient = await prisma.ingredient.delete({
        where: { id: data.id },
      });

      await auditLog(
        'DELETE_INGREDIENT',
        {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          action: 'Deleted ingredient',
        },
        data.user
      );

      return ingredient;
    } catch (error) {
      logger.error(`Error deleting ingredient: ${error}`);
      throw error;
    }
  }

  async getIngredients(): Promise<Ingredient[] | null> {
    try {
      return await prisma.ingredient.findMany({
        include: {
          supplier: true,
          stockLogs: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Error getting ingredients: ${error}`);
      throw error;
    }
  }

  async getIngredient(id: string): Promise<Ingredient | null> {
    try {
      return await prisma.ingredient.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error(`Error getting ingredient: ${error}`);
      throw error;
    }
  }

  async getIngredientByName(name: string): Promise<Ingredient | null> {
    try {
      return await prisma.ingredient.findFirst({
        where: { name },
      });
    } catch (error) {
      logger.error(`Error getting ingredient by name: ${error}`);
      throw error;
    }
  }

  async createProduct(data: {
    user: string;
    name: string;
    description?: string | null;
    categoryId: string;
    image?: string | null;
    preparationTime: number;
    allergens?: string[] | [];
    nutritionalInfo?: string | {};
    isAvailable: boolean;
    price: number;
    ingredients: {
      ingredientId: string;
      quantity: number;
    }[];
  }): Promise<Product> {
    try {
      const product = await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          image: data.image,
          preparationTime: data.preparationTime,
          allergens: data.allergens,
          nutritionalInfo: data.nutritionalInfo,
          price: data.price,
          isAvailable: data.isAvailable,
          ingredients: {
            create: data.ingredients.map((ingredient) => ({
              ingredientId: ingredient.ingredientId,
              quantity: ingredient.quantity,
              unit: 'PORTIONS',
              isOptional: false,
            })),
          },
        },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
          category: true,
        },
      });

      await auditLog(
        'CREATE_PRODUCT',
        {
          productId: product.id,
          productName: product.name,
          categoryId: product.categoryId,
          ingredientCount: data.ingredients.length,
          action: 'Created new product',
        },
        data.user
      );

      return product;
    } catch (error) {
      logger.error(`Error creating product: ${error}`);
      throw error;
    }
  }

  async updateProduct(data: {
    user: string;
    id: string;
    name?: string;
    description?: string | null;
    categoryId?: string;
    image?: string | null;
    preparationTime?: number;
    allergens?: string[] | null;
    nutritionalInfo?: Record<string, any> | null;
    isAvailable?: boolean;
    price?: number;
    ingredients?: {
      ingredientId: string;
      quantity: number;
    }[];
  }): Promise<Product> {
    try {
      // First check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: data.id },
        include: { ingredients: true },
      });

      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Prepare update data excluding undefined values
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.image !== undefined) updateData.image = data.image;
      if (data.preparationTime !== undefined) updateData.preparationTime = data.preparationTime;
      if (data.allergens !== undefined) updateData.allergens = data.allergens;
      if (data.nutritionalInfo !== undefined) updateData.nutritionalInfo = data.nutritionalInfo;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;

      // Only update ingredients if provided
      if (data.ingredients) {
        updateData.ingredients = {
          deleteMany: {}, // Delete existing ingredients
          create: data.ingredients.map((ingredient) => ({
            ingredientId: ingredient.ingredientId,
            quantity: ingredient.quantity,
            unit: 'PORTIONS',
            isOptional: false,
          })),
        };
      }

      const product = await prisma.product.update({
        where: { id: data.id },
        data: updateData,
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
          category: true,
        },
      });

      await auditLog(
        'UPDATE_PRODUCT',
        {
          productId: product.id,
          productName: product.name,
          categoryId: product.categoryId,
          ingredientCount: data.ingredients?.length ?? existingProduct.ingredients.length,
          changes: Object.keys(updateData).join(', '),
          action: 'Updated product',
        },
        data.user
      );

      return product;
    } catch (error) {
      logger.error(`Error updating product: ${error}`);
      if (error instanceof Error) {
        throw new Error(`Failed to update product: ${error.message}`);
      }
      throw error;
    }
  }

  async deleteProduct(data: { user: string; id: string }): Promise<Product> {
    try {
      const product = await prisma.product.delete({
        where: { id: data.id },
      });
      await prisma.productIngredient.deleteMany({
        where: { productId: data.id },
      });

      await auditLog(
        'DELETE_PRODUCT',
        {
          productId: product.id,
          productName: product.name,
          action: 'Deleted product',
        },
        data.user
      );

      return product;
    } catch (error) {
      logger.error(`Error deleting product: ${error}`);
      throw error;
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
          category: true,
        },
      });
    } catch (error) {
      logger.error(`Error getting products: ${error}`);
      throw error;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      return await prisma.product.findUnique({
        where: { id },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
          category: true,
        },
      });
    } catch (error) {
      logger.error(`Error getting product: ${error}`);
      throw error;
    }
  }

  async createCategory(data: {
    user: string;
    name: string;
    description?: string | null;
  }): Promise<Category> {
    try {
      const category = await prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });

      await auditLog(
        'CREATE_CATEGORY',
        {
          categoryId: category.id,
          categoryName: category.name,
          action: 'Created new category',
        },
        data.user
      );

      return category;
    } catch (error) {
      logger.error(`Error creating category: ${error}`);
      throw error;
    }
  }

  async deleteCategory(data: { user: string; id: string }): Promise<Category> {
    try {
      const category = await prisma.category.delete({
        where: { id: data.id },
      });

      await auditLog(
        'DELETE_CATEGORY',
        {
          categoryId: category.id,
          categoryName: category.name,
          action: 'Deleted category',
        },
        data.user
      );

      return category;
    } catch (error) {
      logger.error(`Error deleting category: ${error}`);
      throw error;
    }
  }

  async updateCategory(data: {
    user: string;
    id: string;
    name?: string;
    description?: string | null;
  }): Promise<Category> {
    try {
      const category = await prisma.category.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
        },
      });

      await auditLog(
        'UPDATE_CATEGORY',
        {
          categoryId: category.id,
          categoryName: category.name,
          action: 'Updated category',
        },
        data.user
      );

      return category;
    } catch (error) {
      logger.error(`Error updating category: ${error}`);
      throw error;
    }
  }

  async getCategory(id: string): Promise<Category | null> {
    try {
      return await prisma.category.findUnique({
        where: { id },
        include: {
          products: true,
        },
      });
    } catch (error) {
      logger.error(`Error getting category: ${error}`);
      throw error;
    }
  }

  async getCategories(): Promise<Category[] | null> {
    try {
      return await prisma.category.findMany();
    } catch (error) {
      logger.error(`Error getting categories: ${error}`);
      throw error;
    }
  }

  async updateIngredientStock(data: {
    user: string;
    ingredientId: string;
    quantity: number;
    type: 'PURCHASE' | 'USAGE' | 'ADJUSTMENT' | 'WASTE' | 'RETURN';
    reason?: string;
  }): Promise<IngredientStockLog> {
    try {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: data.ingredientId },
      });

      if (!ingredient) {
        throw new Error('Ingredient not found');
      }

      // Create stock log
      const stockLog = await prisma.ingredientStockLog.create({
        data: {
          ingredientId: data.ingredientId,
          quantity: data.quantity,
          type: data.type,
          reason: data.reason,
          performedBy: data.user,
        },
      });

      // Update ingredient stock
      await prisma.ingredient.update({
        where: { id: data.ingredientId },
        data: {
          stock: {
            increment: data.quantity,
          },
        },
      });

      return stockLog;
    } catch (error) {
      logger.error('Error updating ingredient stock:', error);
      throw error;
    }
  }

  async getLowStockIngredients(): Promise<Ingredient[]> {
    try {
      return await prisma.ingredient.findMany({
        where: {
          stock: {
            lte: prisma.ingredient.fields.reorderPoint,
          },
        },
        include: {
          supplier: true,
        },
      });
    } catch (error) {
      logger.error('Error getting low stock ingredients:', error);
      throw error;
    }
  }

  async checkProductAvailability(productId: string): Promise<{
    isAvailable: boolean;
    missingIngredients: string[];
  }> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const missingIngredients = product.ingredients
        .filter((pi) => pi.ingredient.stock < pi.quantity)
        .map((pi) => pi.ingredient.name);

      return {
        isAvailable: missingIngredients.length === 0 && product.isAvailable,
        missingIngredients,
      };
    } catch (error) {
      logger.error('Error checking product availability:', error);
      throw error;
    }
  }
}
