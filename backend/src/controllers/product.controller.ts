import { Request as ExpressRequest, Response } from 'express';
import { ProductService } from '../services/product.service';
import { logger } from '../lib/logging/logger';
import { CategoryFilterOptions, IngredientFilterOptions, PaginationOptions, ProductFilterOptions, SupplierFilterOptions } from '../interfaces/product.interface';
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

  private handleError(error: any, res: Response) {
    logger.error('ProductController Error:', error);

    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    if (error.code === 'DUPLICATE') {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }

  // Product Endpoints
  public getProducts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Extract pagination from query params
      const pagination: PaginationOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };
  
      // Extract filters from query params
      const filters: ProductFilterOptions = {
        search: req.query.search as string,
        isAvailable: req.query.isAvailable === 'true',
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        categoryId: req.query.categoryId as string
      };
  
      const products = await this.productService.getProducts(pagination, filters);
      res.json(products);
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
      const pagination: PaginationOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };
  
      const filters: CategoryFilterOptions = {
        search: req.query.search as string,
        isActive: req.query.isActive === 'true',
        parentId: req.query.parentId as string
      };
  
      const categories = await this.productService.getCategories(pagination, filters);
      res.json(categories);
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
      const pagination: PaginationOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };
  
      const filters: IngredientFilterOptions = {
        search: req.query.search as string,
        category: req.query.category as IngredientCategory,
        supplierId: req.query.supplierId as string,
        isExtra: req.query.isExtra === 'true',
        minStock: req.query.minStock ? parseInt(req.query.minStock as string) : undefined
      };
  
      const ingredients = await this.productService.getIngredients(pagination, filters);
      res.json(ingredients);
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
      const pagination: PaginationOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };
  
      const filters: SupplierFilterOptions = {
        search: req.query.search as string,
        hasIngredients: req.query.hasIngredients === 'true'
      };
  
      const suppliers = await this.productService.getSuppliers(pagination, filters);
      res.json(suppliers);
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
