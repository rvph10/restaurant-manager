import { prisma } from '../prisma/client';
import {
  Prisma,
  Product,
  Category,
  Ingredient,
  MeasurementUnit,
  IngredientCategory,
  Supplier,
} from '@prisma/client';
import { logger } from '../lib/logging/logger';
import {
  CreateCategoryInput,
  CreateIngredientInput,
  CreateProductInput,
  CreateSupplierInput,
} from '../interfaces/product.interface';
import { auditLog } from '../lib/logging/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { hasValidLength, isPositiveNumber, isValidEmail, isValidPhoneNumber } from '../utils/valid';

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

export class ProductService {
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

  async checkProductExists(params: { id?: string; name?: string }): Promise<boolean> {
    try {
      if (!params.id && !params.name) {
        throw new Error('At least one parameter (id or name) must be provided');
      }

      const whereClause: Prisma.ProductWhereInput = {
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

      const product = await prisma.product.findFirst({
        where: whereClause,
      });

      return !!product;
    } catch (error) {
      return this.handleServiceError(error, 'checkProductExists');
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

  async checkCategoryExists(params: { id?: string; name?: string }): Promise<boolean> {
    try {
      if (!params.id && !params.name) {
        throw new Error('At least one parameter (id or name) must be provided');
      }

      const whereClause: Prisma.CategoryWhereInput = {
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

      const category = await prisma.category.findFirst({
        where: whereClause,
      });

      return !!category;
    } catch (error) {
      return this.handleServiceError(error, 'checkCategoryExists');
    }
  }

  async checkSupplierExists(params: {
    id?: string;
    name?: string;
    phone?: string;
  }): Promise<boolean> {
    try {
      if (!params.id && !params.name && !params.phone) {
        throw new Error('At least one parameter (id, name or phone) must be provided');
      }

      if (params.phone && !isValidPhoneNumber(params.phone)) {
        throw new Error('Invalid phone number');
      }

      const whereClause: Prisma.SupplierWhereInput = {
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
      if (params.phone) {
        whereClause.OR!.push({
          phone: {
            equals: params.phone,
            mode: 'insensitive', // Case insensitive search
          },
        });
      }

      const supplier = await prisma.supplier.findFirst({
        where: whereClause,
      });

      return !!supplier;
    } catch (error) {
      return this.handleServiceError(error, 'checkSupplierExists');
    }
  }

  async createIngredient(data: CreateIngredientInput): Promise<Ingredient> {
    try {
      if (isPositiveNumber(data.cost)) throw new Error('Cost must be a positive number');
      if (isPositiveNumber(data.stock)) throw new Error('Stock must be a positive number');
      if (isPositiveNumber(data.reorderPoint))
        throw new Error('Reorder point must be a positive number');
      if (isPositiveNumber(data.reorderAmount))
        throw new Error('Reorder amount must be a positive number');
      if (!Object.values(IngredientCategory).includes(data.category))
        throw new Error('Invalid category');

      if (data.isExtra && !data.extraPrice)
        throw new Error('Extra price must be provided for extra ingredients');
      if (!data.isExtra && data.extraPrice)
        throw new Error('Extra price can only be provided for extra ingredients');
      if (data.isExtra && (data.extraPrice ?? 0) < 0)
        throw new Error('Extra price must be a positive number');

      if (data.supplierId && !(await this.checkSupplierExists({ id: data.supplierId }))) {
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
        'CREATE INGREDIENT',
        {
          entityName: data.name,
          entityID: ingredient.id,
        },
        data.user || 'SYSTEM'
      );

      return ingredient;
    } catch (error) {
      return this.handleServiceError(error, 'createIngredient');
    }
  }

  async updateIngredient(id: string, data: CreateIngredientInput): Promise<Ingredient> {
    try {
      if (isPositiveNumber(data.cost)) throw new Error('Cost must be a positive number');
      if (isPositiveNumber(data.stock)) throw new Error('Stock must be a positive number');
      if (!Object.values(IngredientCategory).includes(data.category))
        throw new Error('Invalid category');
      if (isPositiveNumber(data.reorderPoint))
        throw new Error('Reorder point must be a positive number');
      if (isPositiveNumber(data.reorderAmount))
        throw new Error('Reorder amount must be a positive number');
      if (data.isExtra && !data.extraPrice)
        throw new Error('Extra price must be provided for extra ingredients');
      if (!data.isExtra && data.extraPrice)
        throw new Error('Extra price can only be provided for extra ingredients');
      if (data.isExtra && (data.extraPrice ?? 0) < 0)
        throw new Error('Extra price must be a positive number');
      if (data.supplierId && !(await this.checkSupplierExists({ id: data.supplierId })))
        throw new Error('Supplier with this ID does not exist');

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
        'UPDATE INGREDIENT',
        {
          entityName: data.name,
          entityID: ingredient,
        },
        data.user || 'SYSTEM'
      );

      return ingredient;
    } catch (error) {
      return this.handleServiceError(error, 'updateIngredient');
    }
  }

  async deleteIngredient(id: string): Promise<void> {
    try {
      if (!(await this.checkIngredientExists({ id })))
        throw new Error('Ingredient with this ID does not exist');
      const ingredient = await prisma.ingredient.delete({
        where: { id },
      });

      auditLog(
        'DELETE INGREDIENT',
        {
          entityName: ingredient.name,
          entityID: ingredient.id,
        },
        ingredient.id
      );
    } catch (error) {
      return this.handleServiceError(error, 'deleteIngredient');
    }
  }

  async getIngredients(): Promise<Ingredient[]> {
    try {
      return await prisma.ingredient.findMany();
    } catch (error) {
      return this.handleServiceError(error, 'getIngredients');
    }
  }

  async getIngredient(id: string): Promise<Ingredient | null> {
    try {
      if (!id) throw new Error('ID must be provided');
      if (!(await this.checkIngredientExists({ id })))
        throw new Error('Ingredient with this ID does not exist');
      return await prisma.ingredient.findUnique({ where: { id } });
    } catch (error) {
      return this.handleServiceError(error, 'getIngredient');
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      return await prisma.category.findMany();
    } catch (error) {
      return this.handleServiceError(error, 'getCategories');
    }
  }

  async getCategory(id: string): Promise<Category | null> {
    try {
      if (!id) throw new Error('ID must be provided');
      if (!(await this.checkCategoryExists({ id })))
        throw new Error('Category with this ID does not exist');
      return await prisma.category.findUnique({ where: { id } });
    } catch (error) {
      return this.handleServiceError(error, 'getCategory');
    }
  }

  async createCategory(data: CreateCategoryInput, newParentCategory: boolean): Promise<Category> {
    try {
      if (!isPositiveNumber(data.displayOrder))
        throw new Error('Display order must be a positive number');
      if (data.description && !hasValidLength(data.description, 0, 128))
        throw new Error('Description must be at most 128 characters');
      if (await this.checkCategoryExists({ name: data.name }))
        throw new Error('Category with this name already exists');
      let nextCategory = { displayOrder: 0 };
      if (newParentCategory) {
        const foundCategory = await prisma.category.findFirst({
          orderBy: { displayOrder: 'desc' },
        });
        nextCategory = foundCategory ? foundCategory : nextCategory;
      }
      const category = await prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          displayOrder: newParentCategory
            ? (nextCategory?.displayOrder || 0) + 1
            : data.displayOrder,
          isActive: data.isActive,
          parentId: data.parentId,
        },
      });
      auditLog(
        'CREATE CATEGORY',
        {
          entityName: data.name,
          entityID: category.id,
        },
        data.user || 'SYSTEM'
      );
      return category;
    } catch (error) {
      return this.handleServiceError(error, 'createCategory');
    }
  }

  async updateCategory(
    id: string,
    data: CreateCategoryInput,
    newParentCategory: boolean
  ): Promise<Category> {
    try {
      if (isPositiveNumber(data.displayOrder))
        throw new Error('Display order must be a positive number');
      if (data.description && hasValidLength(data.description, 0, 128))
        throw new Error('Description must be at most 128 characters');
      if (await this.checkCategoryExists({ name: data.name }))
        throw new Error('Category with this name already exists');
      let nextCategory = { displayOrder: 0 };
      if (newParentCategory) {
        const foundCategory = await prisma.category.findFirst({
          orderBy: { displayOrder: 'desc' },
        });
        nextCategory = foundCategory ? foundCategory : nextCategory;
      }
      const category = await prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          displayOrder: newParentCategory
            ? (nextCategory?.displayOrder || 0) + 1
            : data.displayOrder,
          isActive: data.isActive,
          parentId: data.parentId,
        },
      });
      auditLog(
        'UPDATE CATEGORY',
        {
          entityName: data.name,
          entityID: category,
        },
        data.user || 'SYSTEM'
      );
      return category;
    } catch (error) {
      return this.handleServiceError(error, 'updateCategory');
    }
  }

  async deleteCategory(id: string, user: string): Promise<void> {
    try {
      if (!(await this.checkCategoryExists({ id })))
        throw new Error('Category with this ID does not exist');
      const category = await prisma.category.delete({ where: { id } });
      auditLog(
        'DELETE CATEGORY',
        {
          entityName: category.name,
          entityID: category.id,
        },
        user
      );
    } catch (error) {
      return this.handleServiceError(error, 'deleteCategory');
    }
  }

  async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    try {
      if (!category) throw new Error('Category must be provided');
      if (!Object.values(IngredientCategory).includes(category as IngredientCategory)) {
        throw new Error('Invalid category');
      }
      return await prisma.ingredient.findMany({
        where: { category: category as IngredientCategory },
      });
    } catch (error) {
      return this.handleServiceError(error, 'getIngredientsByCategory');
    }
  }

  async getIngredientsBySupplier(supplierId: string): Promise<Ingredient[]> {
    try {
      if (!supplierId) throw new Error('Supplier ID must be provided');
      if (!(await this.checkSupplierExists({ id: supplierId })))
        throw new Error('Supplier with this ID does not exist');
      return await prisma.ingredient.findMany({
        where: { supplierId },
      });
    } catch (error) {
      return this.handleServiceError(error, 'getIngredientsBySupplier');
    }
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    try {
      if (isPositiveNumber(data.price)) throw new Error('Price must be a positive number');
      if (data.freeExtras > 0 && !data.freeExtrasCategory)
        throw new Error('Free extras category must be provided');
      if (data.preparationTime && isPositiveNumber(data.preparationTime))
        throw new Error('Preparation time must be a positive number');
      if (await this.checkCategoryExists({ name: data.name }))
        throw new Error('Category with this name already exists');
      if (await this.checkIngredientExists({ name: data.name }))
        throw new Error('Ingredient with this name already exists');
      const product = await prisma.product.create({
        data: {
          name: data.name,
          description: data.description || null,
          price: new Decimal(data.price),
          categoryId: data.categoryId,
          image: data.image || null,
          isAvailable: data.isAvailable,
          preparationTime: data.preparationTime || 15,
          allergens: data.allergens || [],
          freeExtras: data.freeExtras || 0,
          freeExtraItems: Array.isArray(data.freeExtrasCategory) ? data.freeExtrasCategory : [],
          ingredients: {
            connect: data.ingredients.map((ingredient) => ({ id: ingredient })),
          },
        },
      });
      auditLog(
        'CREATE PRODUCT',
        {
          entityName: data.name,
          entityID: product.id,
        },
        data.user || 'SYSTEM'
      );
      return product;
    } catch (error) {
      return this.handleServiceError(error, 'createProduct');
    }
  }

  async updateProduct(id: string, data: CreateProductInput): Promise<Product> {
    try {
      if (isPositiveNumber(data.price)) throw new Error('Price must be a positive number');
      if (data.freeExtras > 0 && !data.freeExtrasCategory)
        throw new Error('Free extras category must be provided');
      if (data.preparationTime && isPositiveNumber(data.preparationTime))
        throw new Error('Preparation time must be a positive number');
      if (await this.checkCategoryExists({ name: data.name })) {
        throw new Error('Category with this name already exists');
      }
      if (await this.checkIngredientExists({ name: data.name })) {
        throw new Error('Ingredient with this name already exists');
      }
      const product = await prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          price: new Decimal(data.price),
          categoryId: data.categoryId,
          image: data.image || null,
          isAvailable: data.isAvailable,
          preparationTime: data.preparationTime || 15,
          allergens: data.allergens || [],
          freeExtras: data.freeExtras || 0,
          freeExtraItems: Array.isArray(data.freeExtrasCategory) ? data.freeExtrasCategory : [],
          ingredients: {
            set: data.ingredients.map((ingredient) => ({ id: ingredient })),
          },
        },
      });
      auditLog(
        'UPDATE PRODUCT',
        {
          entityName: data.name,
          entityID: product,
        },
        data.user || 'SYSTEM'
      );
      return product;
    } catch (error) {
      return this.handleServiceError(error, 'updateProduct');
    }
  }

  async deleteProduct(id: string, user: string): Promise<void> {
    try {
      if (!(await this.checkIngredientExists({ id }))) {
        throw new Error('Ingredient with this ID does not exist');
      }
      const product = await prisma.product.delete({
        where: { id },
      });
      auditLog(
        'DELETE PRODUCT',
        {
          entityName: product.name,
          entityID: product.id,
        },
        user || 'SYSTEM'
      );
    } catch (error) {
      return this.handleServiceError(error, 'deleteProduct');
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      return await prisma.product.findMany();
    } catch (error) {
      return this.handleServiceError(error, 'getProducts');
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      if (!id) {
        throw new Error('ID must be provided');
      }
      const product = await prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      return this.handleServiceError(error, 'getProduct');
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      if (!category) {
        throw new Error('Category must be provided');
      }
      return await prisma.product.findMany({
        where: { categoryId: category },
      });
    } catch (error) {
      return this.handleServiceError(error, 'getProductsByCategory');
    }
  }

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    try {
      if (!data.name) throw new Error('Name must be provided');

      if (!data.phone && !isValidPhoneNumber(data.phone)) throw new Error('Invalid phone number');

      if (await this.checkSupplierExists({ name: data.name, phone: data.phone })) {
        throw new Error('Supplier with this name/phone already exists');
      }
      const supplier = await prisma.supplier.create({
        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone,
          address: data.address || null,
        },
      });
      auditLog(
        'CREATE SUPPLIER',
        {
          entityName: data.name,
          entityID: supplier.id,
        },
        data.user || 'SYSTEM'
      );
      return supplier;
    } catch (error) {
      return this.handleServiceError(error, 'createSupplier');
    }
  }

  async updateSupplier(id: string, data: CreateSupplierInput): Promise<Supplier> {
    try {
      if (!data.name) throw new Error('Name must be provided');
      if (!data.phone && !isValidPhoneNumber(data.phone)) throw new Error('Invalid phone number');
      if (await this.checkSupplierExists({ name: data.name, phone: data.phone }))
        throw new Error('Supplier with this name/phone already exists');
      if (data.email && isValidEmail(data.email)) throw new Error('Invalid email address');
      const supplier = await prisma.supplier.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone,
          address: data.address || null,
        },
      });
      auditLog(
        'UPDATE SUPPLIER',
        {
          entityName: data.name,
          entityID: supplier,
        },
        data.user || 'SYSTEM'
      );
      return supplier;
    } catch (error) {
      return this.handleServiceError(error, 'updateSupplier');
    }
  }

  async deleteSupplier(id: string, user: string): Promise<void> {
    try {
      if (!(await this.checkSupplierExists({ id }))) {
        throw new Error('Supplier with this ID does not exist');
      }
      const supplier = await prisma.supplier.delete({
        where: { id },
      });
      auditLog(
        'DELETE SUPPLIER',
        {
          entityName: supplier.name,
          entityID: supplier.id,
        },
        user || 'SYSTEM'
      );
    } catch (error) {
      return this.handleServiceError(error, 'deleteSupplier');
    }
  }

  async getSuppliers(): Promise<Supplier[]> {
    try {
      return await prisma.supplier.findMany();
    } catch (error) {
      return this.handleServiceError(error, 'getSuppliers');
    }
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    try {
      if (!id) {
        throw new Error('ID must be provided');
      }
      const supplier = await prisma.supplier.findUnique({
        where: { id },
      });
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      return supplier;
    } catch (error) {
      return this.handleServiceError(error, 'getSupplier');
    }
  }
}
