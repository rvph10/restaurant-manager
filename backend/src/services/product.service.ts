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
  CategoryFilterOptions,
  CreateCategoryInput,
  CreateIngredientInput,
  CreateProductInput,
  CreateSupplierInput,
  IngredientFilterOptions,
  PaginatedResponse,
  PaginationOptions,
  ProductFilterOptions,
  SupplierFilterOptions,
} from '../interfaces/product.interface';
import { auditLog } from '../lib/logging/logger';
import { Decimal } from '@prisma/client/runtime/library';
import {
  hasValidLength,
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

export class ProductService {
  // Add these constants at the top of the class
  private readonly PRODUCT_SORT_FIELDS = ['name', 'price', 'createdAt', 'preparationTime'];
  private readonly INGREDIENT_SORT_FIELDS = ['name', 'stock', 'createdAt', 'cost'];
  private readonly CATEGORY_SORT_FIELDS = ['name', 'displayOrder', 'createdAt'];
  private readonly SUPPLIER_SORT_FIELDS = ['name', 'createdAt', 'email'];

  private validatePaginationAndSorting(
    pagination: PaginationOptions,
    allowedSortFields: string[]
  ): void {
    const { page, limit, sortBy, sortOrder } = pagination;

    if (page !== undefined && (page < 1 || !Number.isInteger(page))) {
      throw new ValidationError('Page must be a positive integer');
    }

    if (limit !== undefined && (limit < 1 || !Number.isInteger(limit))) {
      throw new ValidationError('Limit must be a positive integer');
    }

    if (sortBy && !allowedSortFields.includes(sortBy)) {
      throw new ValidationError(`Sort field must be one of: ${allowedSortFields.join(', ')}`);
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new ValidationError('Sort order must be either "asc" or "desc"');
    }
  }

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

  /**
   * Check if methods Uses good parameter
   */

  private validateCreateIngredient(data: CreateIngredientInput) {
    // Required fields
    if (!data.name?.trim()) throw new MissingParameterError('Name is required');
    if (!data.unit) throw new MissingParameterError('Unit is required');
    if (!data.category) throw new MissingParameterError('Category is required');

    // Length validations
    if (!hasValidLength(data.name, 2, 50))
      throw new ValidationError('Name must be between 2 and 50 characters');
    if (data.description && !hasValidLength(data.description, 0, 200))
      throw new ValidationError('Description must not exceed 200 characters');

    // Numeric validations
    if (!isPositiveNumber(data.stock)) throw new ValidationError('Stock must be a positive number');
    if (data.stock > 1000000) throw new ValidationError('Stock value is too high');

    if (!isPositiveNumber(data.reorderPoint))
      throw new ValidationError('Reorder point must be a positive number');
    if (!isPositiveNumber(data.reorderAmount))
      throw new ValidationError('Reorder amount must be a positive number');
    if (!isPositiveNumber(data.cost)) throw new ValidationError('Cost must be a positive number');
    if (!isPositiveNumber(data.price)) throw new ValidationError('Price must be a positive number');

    // Enum validations
    if (!Object.values(MeasurementUnit).includes(data.unit))
      throw new ValidationError('Invalid measurement unit');
    if (!Object.values(IngredientCategory).includes(data.category))
      throw new ValidationError('Invalid category');

    // Extra price validation
    if (data.isExtra && !isPositiveNumber(data.extraPrice ?? 0))
      throw new ValidationError('Extra price must be a positive number when isExtra is true');

    // UUID validation
    if (data.supplierId && !isValidUUID(data.supplierId))
      throw new ValidationError('Invalid supplier ID format');
  }

  private validateCreateCategory(data: CreateCategoryInput) {
    // Required fields
    if (!data.name?.trim()) throw new MissingParameterError('Name is required');

    // Length validations
    if (!hasValidLength(data.name, 2, 50))
      throw new ValidationError('Name must be between 2 and 50 characters');
    if (data.description && !hasValidLength(data.description, 0, 200))
      throw new ValidationError('Description must not exceed 200 characters');

    // Display order validation
    if (!isPositiveNumber(data.displayOrder))
      throw new ValidationError('Display order must be a positive number');
    if (data.displayOrder > 1000) throw new ValidationError('Display order value is too high');

    // Parent ID validation
    if (data.parentId && !isValidUUID(data.parentId))
      throw new ValidationError('Invalid parent category ID format');
  }

  private validateCreateProduct(data: CreateProductInput) {
    // Required fields
    if (!data.name?.trim()) throw new MissingParameterError('Name is required');
    if (!data.categoryId) throw new MissingParameterError('Category ID is required');

    // Length validations
    if (!hasValidLength(data.name, 2, 100))
      throw new ValidationError('Name must be between 2 and 100 characters');
    if (data.description && !hasValidLength(data.description, 0, 500))
      throw new ValidationError('Description must not exceed 500 characters');

    // Price validation
    if (!isPositiveNumber(data.price)) throw new ValidationError('Price must be a positive number');
    if (data.price > 10000) throw new ValidationError('Price value is too high');

    // Preparation time validation
    if (!isPositiveNumber(data.preparationTime))
      throw new ValidationError('Preparation time must be a positive number');
    if (data.preparationTime > 180)
      throw new ValidationError('Preparation time cannot exceed 180 minutes');

    // Free extras validation
    if (data.freeExtras < 0) throw new ValidationError('Free extras cannot be negative');
    if (data.freeExtras > 0 && !data.freeExtrasCategory)
      throw new ValidationError(
        'Free extras category is required when free extras is greater than 0'
      );

    // Ingredients validation
    if (!Array.isArray(data.ingredients) || data.ingredients.length === 0)
      throw new ValidationError('At least one ingredient is required');
    if (data.ingredients.some((id) => !isValidUUID(id)))
      throw new ValidationError('Invalid ingredient ID format');

    // Unit validation
    if (!Object.values(MeasurementUnit).includes(data.unit))
      throw new ValidationError('Invalid measurement unit');
  }

  private validateCreateSupplier(data: CreateSupplierInput) {
    // Required fields
    if (!data.name?.trim()) throw new MissingParameterError('Name is required');
    if (!data.phone?.trim()) throw new MissingParameterError('Phone is required');

    // Length validations
    if (!hasValidLength(data.name, 2, 100))
      throw new ValidationError('Name must be between 2 and 100 characters');
    if (data.address && !hasValidLength(data.address, 5, 200))
      throw new ValidationError('Address must be between 5 and 200 characters');

    // Phone validation
    if (!isValidPhoneNumber(data.phone)) throw new ValidationError('Invalid phone number format');

    // Email validation (if provided)
    if (data.email && !isValidEmail(data.email)) throw new ValidationError('Invalid email format');
  }

  private validateUpdateIngredient(id: string, data: CreateIngredientInput) {
    if (!id) throw new MissingParameterError('ID must be provided');
    if (!isValidUUID(id)) throw new ValidationError('Invalid ID format');
    this.validateCreateIngredient(data);
  }

  private validateUpdateProduct(id: string, data: CreateProductInput) {
    if (!id) throw new MissingParameterError('ID must be provided');
    if (!isValidUUID(id)) throw new ValidationError('Invalid ID format');
    this.validateCreateProduct(data);
  }

  private validateUpdateCategory(id: string, data: CreateCategoryInput) {
    if (!id) throw new MissingParameterError('ID must be provided');
    if (!isValidUUID(id)) throw new ValidationError('Invalid ID format');
    this.validateCreateCategory(data);
  }

  private validateUpdateSupplier(id: string, data: CreateSupplierInput) {
    if (!id) throw new MissingParameterError('ID must be provided');
    if (!isValidUUID(id)) throw new ValidationError('Invalid ID format');
    this.validateCreateSupplier(data);
  }

  private validateDeleteOperation(id: string) {
    if (!id) throw new MissingParameterError('ID must be provided');
    if (!isValidUUID(id)) throw new ValidationError('Invalid ID format');
  }

  private validateGetOperation(id: string) {
    if (!id) throw new MissingParameterError('ID must be provided');
    if (!isValidUUID(id)) throw new ValidationError('Invalid ID format');
  }

  async checkProductExists(params: { id?: string; name?: string }): Promise<boolean> {
    try {
      if (!params.id && !params.name) {
        throw new MissingParameterError('At least one parameter (id or name) must be provided');
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
        throw new MissingParameterError('At least one parameter (id or name) must be provided');
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
        throw new MissingParameterError('At least one parameter (id or name) must be provided');
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
        throw new MissingParameterError(
          'At least one parameter (id, name or phone) must be provided'
        );
      }

      if (params.phone && !isValidPhoneNumber(params.phone)) {
        throw new ValidationError('Invalid phone number');
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
      this.validateCreateIngredient(data);
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
      this.validateUpdateIngredient(id, data);

      return await prisma.$transaction(async (tx) => {
        // Check ingredient exists
        const existingIngredient = await tx.ingredient.findUnique({
          where: { id },
          include: { products: true },
        });

        if (!existingIngredient) {
          throw new ResourceNotFoundError('Ingredient not found');
        }

        // Check name duplicates
        const duplicateName = await tx.ingredient.findFirst({
          where: {
            name: data.name,
            id: { not: id },
          },
        });

        if (duplicateName) {
          throw new DuplicateResourceError('Ingredient name already exists');
        }

        const ingredient = await tx.ingredient.update({
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

        await auditLog(
          'UPDATE_INGREDIENT',
          {
            entityName: data.name,
            entityID: ingredient,
          },
          data.user || 'SYSTEM'
        );

        return ingredient;
      });
    } catch (error) {
      return this.handleServiceError(error, 'updateIngredient');
    }
  }

  async deleteIngredient(id: string): Promise<void> {
    try {
      this.validateDeleteOperation(id);

      await prisma.$transaction(async (tx) => {
        const ingredient = await tx.ingredient.findUnique({
          where: { id },
          include: { products: true },
        });

        if (!ingredient) {
          throw new ResourceNotFoundError('Ingredient not found');
        }

        // Check if ingredient is used in any products
        if (ingredient.products.length > 0) {
          throw new ValidationError('Cannot delete ingredient that is used in products');
        }

        await tx.ingredient.delete({ where: { id } });

        await auditLog(
          'DELETE_INGREDIENT',
          {
            entityName: ingredient.name,
            entityID: ingredient.id,
          },
          ingredient.id
        );
      });
    } catch (error) {
      return this.handleServiceError(error, 'deleteIngredient');
    }
  }

  async getIngredients(
    pagination: PaginationOptions = {},
    filters: IngredientFilterOptions = {}
  ): Promise<PaginatedResponse<Ingredient>> {
    try {
      this.validatePaginationAndSorting(pagination, this.INGREDIENT_SORT_FIELDS);
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      const skip = (page - 1) * limit;

      // Build where clause based on filters
      const where: Prisma.IngredientWhereInput = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.supplierId) {
        where.supplierId = filters.supplierId;
      }

      if (typeof filters.isExtra === 'boolean') {
        where.isExtra = filters.isExtra;
      }

      if (filters.minStock) {
        where.stock = { gte: filters.minStock };
      }

      const [data, total] = await prisma.$transaction([
        prisma.ingredient.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            supplier: true,
          },
        }),
        prisma.ingredient.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      };
    } catch (error) {
      return this.handleServiceError(error, 'getIngredients');
    }
  }

  async getIngredient(id: string): Promise<Ingredient | null> {
    try {
      this.validateGetOperation(id);
      if (!(await this.checkIngredientExists({ id })))
        throw new ResourceNotFoundError('Ingredient with this ID does not exist');
      return await prisma.ingredient.findUnique({ where: { id } });
    } catch (error) {
      return this.handleServiceError(error, 'getIngredient');
    }
  }

  async getCategories(
    pagination: PaginationOptions = {},
    filters: CategoryFilterOptions = {}
  ): Promise<PaginatedResponse<Category>> {
    try {
      this.validatePaginationAndSorting(pagination, this.CATEGORY_SORT_FIELDS);
      const { page = 1, limit = 10, sortBy = 'displayOrder', sortOrder = 'asc' } = pagination;

      const skip = (page - 1) * limit;

      // Build where clause based on filters
      const where: Prisma.CategoryWhereInput = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (typeof filters.isActive === 'boolean') {
        where.isActive = filters.isActive;
      }

      if (filters.parentId) {
        where.parentId = filters.parentId;
      }

      const [data, total] = await prisma.$transaction([
        prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            parent: true,
            children: true,
            products: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.category.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      };
    } catch (error) {
      return this.handleServiceError(error, 'getCategories');
    }
  }

  async getCategory(id: string): Promise<Category | null> {
    try {
      this.validateGetOperation(id);
      if (!(await this.checkCategoryExists({ id })))
        throw new ResourceNotFoundError('Category with this ID does not exist');
      return await prisma.category.findUnique({ where: { id } });
    } catch (error) {
      return this.handleServiceError(error, 'getCategory');
    }
  }

  async createCategory(data: CreateCategoryInput, newParentCategory: boolean): Promise<Category> {
    try {
      this.validateCreateCategory(data);

      return await prisma.$transaction(async (tx) => {
        // Check duplicate name
        const duplicateName = await tx.category.findFirst({
          where: { name: data.name },
        });

        if (duplicateName) {
          throw new DuplicateResourceError('Category with this name already exists');
        }

        // Check parent exists if specified
        if (data.parentId) {
          const parentExists = await tx.category.findUnique({
            where: { id: data.parentId },
          });

          if (!parentExists) {
            throw new ResourceNotFoundError('Parent category not found');
          }
        }

        let nextOrder = data.displayOrder;
        if (newParentCategory) {
          const lastCategory = await tx.category.findFirst({
            orderBy: { displayOrder: 'desc' },
          });
          nextOrder = (lastCategory?.displayOrder || 0) + 1;
        }

        const category = await tx.category.create({
          data: {
            name: data.name,
            description: data.description,
            displayOrder: nextOrder,
            isActive: data.isActive,
            parentId: data.parentId,
          },
        });

        await auditLog(
          'CREATE_CATEGORY',
          {
            entityName: data.name,
            entityID: category.id,
          },
          data.user || 'SYSTEM'
        );

        return category;
      });
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
      this.validateUpdateCategory(id, data);

      return await prisma.$transaction(async (tx) => {
        // Check category exists
        const existingCategory = await tx.category.findUnique({
          where: { id },
          include: { children: true },
        });

        if (!existingCategory) {
          throw new ResourceNotFoundError('Category not found');
        }

        // Check duplicate name (excluding current category)
        const duplicateName = await tx.category.findFirst({
          where: {
            name: data.name,
            id: { not: id },
          },
        });

        if (duplicateName) {
          throw new DuplicateResourceError('Category with this name already exists');
        }

        // Check for circular reference
        if (data.parentId) {
          if (data.parentId === id) {
            throw new ValidationError('Category cannot be its own parent');
          }

          const parent = await tx.category.findUnique({
            where: { id: data.parentId },
          });

          if (!parent) {
            throw new ResourceNotFoundError('Parent category not found');
          }
        }

        let nextOrder = data.displayOrder;
        if (newParentCategory) {
          const lastCategory = await tx.category.findFirst({
            orderBy: { displayOrder: 'desc' },
          });
          nextOrder = (lastCategory?.displayOrder || 0) + 1;
        }

        const category = await tx.category.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            displayOrder: nextOrder,
            isActive: data.isActive,
            parentId: data.parentId,
          },
        });

        await auditLog(
          'UPDATE_CATEGORY',
          {
            entityName: data.name,
            entityID: category,
          },
          data.user || 'SYSTEM'
        );

        return category;
      });
    } catch (error) {
      return this.handleServiceError(error, 'updateCategory');
    }
  }

  async deleteCategory(id: string, user: string): Promise<void> {
    try {
      this.validateDeleteOperation(id);

      await prisma.$transaction(async (tx) => {
        const category = await tx.category.findUnique({
          where: { id },
          include: { children: true, products: true },
        });

        if (!category) {
          throw new ResourceNotFoundError('Category not found');
        }

        if (category.children.length > 0) {
          throw new ValidationError('Cannot delete category with child categories');
        }

        if (category.products.length > 0) {
          throw new ValidationError('Cannot delete category with associated products');
        }

        await tx.category.delete({ where: { id } });

        await auditLog(
          'DELETE_CATEGORY',
          {
            entityName: category.name,
            entityID: id,
          },
          user
        );
      });
    } catch (error) {
      return this.handleServiceError(error, 'deleteCategory');
    }
  }

  async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    try {
      this.validateGetOperation(category);
      if (!Object.values(IngredientCategory).includes(category as IngredientCategory)) {
        throw new ResourceNotFoundError('Invalid category');
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
      this.validateGetOperation(supplierId);
      if (!(await this.checkSupplierExists({ id: supplierId })))
        throw new ResourceNotFoundError('Supplier with this ID does not exist');
      return await prisma.ingredient.findMany({
        where: { supplierId },
      });
    } catch (error) {
      return this.handleServiceError(error, 'getIngredientsBySupplier');
    }
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    try {
      this.validateCreateProduct(data);

      return await prisma.$transaction(async (tx) => {
        // Check duplicates within transaction
        const existingProduct = await tx.product.findFirst({
          where: {
            OR: [{ name: data.name }, { name: { equals: data.name, mode: 'insensitive' } }],
          },
        });

        if (existingProduct) {
          throw new DuplicateResourceError('Product with this name already exists');
        }

        // Check if all ingredients exist
        const ingredients = await tx.ingredient.findMany({
          where: { id: { in: data.ingredients } },
        });

        if (ingredients.length !== data.ingredients.length) {
          throw new ResourceNotFoundError('One or more ingredients not found');
        }

        const product = await tx.product.create({
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

        await auditLog(
          'CREATE_PRODUCT',
          {
            entityName: data.name,
            entityID: product.id,
          },
          data.user || 'SYSTEM'
        );

        return product;
      });
    } catch (error) {
      return this.handleServiceError(error, 'createProduct');
    }
  }

  async updateProduct(id: string, data: CreateProductInput): Promise<Product> {
    try {
      this.validateUpdateProduct(id, data);

      return await prisma.$transaction(async (tx) => {
        // Check product exists
        const existingProduct = await tx.product.findUnique({
          where: { id },
          include: { ingredients: true },
        });

        if (!existingProduct) {
          throw new ResourceNotFoundError('Product not found');
        }

        // Check name duplicates (excluding current product)
        const duplicateName = await tx.product.findFirst({
          where: {
            name: data.name,
            id: { not: id },
          },
        });

        if (duplicateName) {
          throw new DuplicateResourceError('Product name already exists');
        }

        // Verify all ingredients exist
        const ingredients = await tx.ingredient.findMany({
          where: { id: { in: data.ingredients } },
        });

        if (ingredients.length !== data.ingredients.length) {
          throw new ResourceNotFoundError('One or more ingredients not found');
        }

        const product = await tx.product.update({
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

        await auditLog(
          'UPDATE_PRODUCT',
          {
            entityName: data.name,
            entityID: product,
          },
          data.user || 'SYSTEM'
        );

        return product;
      });
    } catch (error) {
      return this.handleServiceError(error, 'updateProduct');
    }
  }

  async deleteProduct(id: string, user: string): Promise<void> {
    try {
      this.validateDeleteOperation(id);

      await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id },
          include: { ingredients: true },
        });

        if (!product) {
          throw new ResourceNotFoundError('Product not found');
        }

        // First disconnect ingredients
        await tx.product.update({
          where: { id },
          data: {
            ingredients: {
              set: [], // Disconnect all ingredients
            },
          },
        });

        // Then delete the product
        await tx.product.delete({ where: { id } });

        await auditLog(
          'DELETE_PRODUCT',
          {
            entityName: product.name,
            entityID: id,
          },
          user || 'SYSTEM'
        );
      });
    } catch (error) {
      return this.handleServiceError(error, 'deleteProduct');
    }
  }

  async getProducts(
    pagination: PaginationOptions = {},
    filters: ProductFilterOptions = {}
  ): Promise<PaginatedResponse<Product>> {
    try {
      this.validatePaginationAndSorting(pagination, this.PRODUCT_SORT_FIELDS)
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      const skip = (page - 1) * limit;

      // Build where clause based on filters
      const where: Prisma.ProductWhereInput = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (typeof filters.isAvailable === 'boolean') {
        where.isAvailable = filters.isAvailable;
      }

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      // Handle price filters
      if (filters.minPrice || filters.maxPrice) {
        where.price = {
          ...(filters.minPrice && { gte: new Decimal(filters.minPrice) }),
          ...(filters.maxPrice && { lte: new Decimal(filters.maxPrice) }),
        };
      }

      // Execute query and count in parallel
      const [data, total] = await prisma.$transaction([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            category: true,
            ingredients: true,
          },
        }),
        prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      };
    } catch (error) {
      return this.handleServiceError(error, 'getProducts');
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      this.validateGetOperation(id);
      const product = await prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new ResourceNotFoundError('Product not found');
      }
      return product;
    } catch (error) {
      return this.handleServiceError(error, 'getProduct');
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      this.validateGetOperation(category);
      return await prisma.product.findMany({
        where: { categoryId: category },
      });
    } catch (error) {
      return this.handleServiceError(error, 'getProductsByCategory');
    }
  }

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    try {
      this.validateCreateSupplier(data);
      if (await this.checkSupplierExists({ name: data.name, phone: data.phone })) {
        throw new DuplicateResourceError('Supplier with this name/phone already exists');
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
      this.validateUpdateSupplier(id, data);
      if (await this.checkSupplierExists({ name: data.name, phone: data.phone }))
        throw new DuplicateResourceError('Supplier with this name/phone already exists');
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
      this.validateDeleteOperation(id);
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

  async getSuppliers(
    pagination: PaginationOptions = {},
    filters: SupplierFilterOptions = {}
  ): Promise<PaginatedResponse<Supplier>> {
    try {
      this.validatePaginationAndSorting(pagination, this.SUPPLIER_SORT_FIELDS);
      const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = pagination;

      const skip = (page - 1) * limit;

      // Build where clause based on filters
      const where: Prisma.SupplierWhereInput = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.hasIngredients) {
        where.ingredients = {
          some: {}, // Has at least one ingredient
        };
      }

      const [data, total] = await prisma.$transaction([
        prisma.supplier.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            ingredients: {
              select: {
                id: true,
                name: true,
                stock: true,
              },
            },
            _count: {
              select: { ingredients: true },
            },
          },
        }),
        prisma.supplier.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      };
    } catch (error) {
      return this.handleServiceError(error, 'getSuppliers');
    }
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    try {
      this.validateGetOperation(id);
      const supplier = await prisma.supplier.findUnique({
        where: { id },
      });
      if (!supplier) {
        throw new ResourceNotFoundError('Supplier not found');
      }
      return supplier;
    } catch (error) {
      return this.handleServiceError(error, 'getSupplier');
    }
  }
}
