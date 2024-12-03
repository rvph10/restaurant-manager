import { Request as ExpressRequest, Response } from 'express';
import { ProductService } from '../services/product.service';
import { logger } from '../lib/logging/logger';
import {
  CategoryFilterOptions,
  IngredientFilterOptions,
  PaginationOptions,
  ProductFilterOptions,
  SupplierFilterOptions,
} from '../interfaces/product.interface';
import { IngredientCategory } from '@prisma/client';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    id: string;
    roles: string[];
  };
}

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  private validateQueryParams(query: any): void {
    const { page, limit } = query;
    if (page && (isNaN(page) || page < 1)) {
      throw new Error('Page must be a positive number');
    }
    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }
  }

  private sendPaginatedResponse<T>(
    res: Response,
    data: {
      data: T[];
      total: number;
      page: number;
      totalPages: number;
      hasMore: boolean;
    }
  ): void {
    res.json({
      status: 'success',
      ...data,
      metadata: {
        currentPage: data.page,
        totalPages: data.totalPages,
        totalItems: data.total,
        hasMore: data.hasMore,
      },
    });
  }

  private buildPaginationOptions(query: any): PaginationOptions {
    this.validateQueryParams(query);
    return {
      page: query.page ? parseInt(query.page as string) : 1,
      limit: query.limit ? parseInt(query.limit as string) : 10,
      sortBy: query.sortBy as string,
      sortOrder: query.sortOrder as 'asc' | 'desc',
    };
  }

  private buildProductFilters(query: any): ProductFilterOptions {
    return {
      search: query.search as string,
      isAvailable: query.isAvailable === 'true',
      minPrice: query.minPrice ? parseFloat(query.minPrice as string) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice as string) : undefined,
      categoryId: query.categoryId as string,
    };
  }

  private buildIngredientFilters(query: any): IngredientFilterOptions {
    return {
      search: query.search as string,
      category: query.category as IngredientCategory,
      supplierId: query.supplierId as string,
      isExtra: query.isExtra === 'true',
      minStock: query.minStock ? parseInt(query.minStock as string) : undefined,
    };
  }

  private buildCategoryFilters(query: any): CategoryFilterOptions {
    return {
      search: query.search as string,
      isActive: query.isActive === 'true',
      parentId: query.parentId as string,
    };
  }

  private buildSupplierFilters(query: any): SupplierFilterOptions {
    return {
      search: query.search as string,
      hasIngredients: query.hasIngredients === 'true',
    };
  }

  private handleError(error: any, res: Response) {
    logger.error('ProductController Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    switch (error.code) {
      case 'VALIDATION_ERROR':
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        });
      case 'NOT_FOUND':
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: error.message,
        });
      case 'DUPLICATE':
        return res.status(409).json({
          status: 'error',
          code: 'DUPLICATE',
          message: error.message,
        });
      default:
        return res.status(500).json({
          status: 'error',
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
    }
  }

  // Product Endpoints
  public getProducts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pagination = this.buildPaginationOptions(req.query);
      const filters = this.buildProductFilters(req.query);

      const result = await this.productService.getProducts(pagination, filters);
      this.sendPaginatedResponse(res, result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const product = await this.productService.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public createProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const product = await this.productService.createProduct({
        ...req.body,
        user: req.user.id,
      });
      res.status(201).json(product);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public updateProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const product = await this.productService.updateProduct(req.params.id, {
        ...req.body,
        user: req.user.id,
      });
      res.json(product);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      await this.productService.deleteProduct(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Category Endpoints
  public getCategories = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pagination = this.buildPaginationOptions(req.query);
      const filters = this.buildCategoryFilters(req.query);

      const result = await this.productService.getCategories(pagination, filters);
      this.sendPaginatedResponse(res, result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const category = await this.productService?.getCategory(req.params.id);
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public createCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const category = await this.productService.createCategory(
        {
          ...req.body,
          user: req.user.id,
        },
        req.body.newParentCategory || false
      );
      res.status(201).json(category);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public updateCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const category = await this.productService.updateCategory(
        req.params.id,
        { ...req.body, user: req.user.id },
        req.body.newParentCategory || false
      );
      res.json(category);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      await this.productService.deleteCategory(req.params.id, req.user.id);
      return res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Ingredient Endpoints
  public getIngredients = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pagination = this.buildPaginationOptions(req.query);
      const filters = this.buildIngredientFilters(req.query);

      const result = await this.productService.getIngredients(pagination, filters);
      this.sendPaginatedResponse(res, result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getIngredient = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ingredient = await this.productService.getIngredient(req.params.id);
      if (!ingredient) {
        res.status(404).json({ error: 'Ingredient not found' });
      }
      res.json(ingredient);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public createIngredient = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const ingredient = await this.productService.createIngredient({
        ...req.body,
        user: req.user.id,
      });
      res.status(201).json(ingredient);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public updateIngredient = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const ingredient = await this.productService.updateIngredient(req.params.id, {
        ...req.body,
        user: req.user.id,
      });
      res.json(ingredient);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public deleteIngredient = async (req: AuthenticatedRequest, res: Response) => {
    try {
      await this.productService.deleteIngredient(req.params.id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Supplier Endpoints
  public getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pagination = this.buildPaginationOptions(req.query);
      const filters = this.buildSupplierFilters(req.query);

      const result = await this.productService.getSuppliers(pagination, filters);
      this.sendPaginatedResponse(res, result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public createSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const supplier = await this.productService.createSupplier({
        ...req.body,
        user: req.user.id,
      });
      res.status(201).json(supplier);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const supplier = await this.productService.updateSupplier(req.params.id, {
        ...req.body,
        user: req.user.id,
      });
      res.json(supplier);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      await this.productService.deleteSupplier(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  };
}
