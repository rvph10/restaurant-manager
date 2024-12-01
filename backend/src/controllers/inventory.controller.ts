import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { CustomerService } from '../services/customer.service';
import { AppError } from '../middleware/error.handler';
import { MeasurementUnit } from '@prisma/client';

export class InventoryController {
  private inventoryService: InventoryService;
  private customerService: CustomerService;

  constructor() {
    this.inventoryService = new InventoryService();
    this.customerService = new CustomerService();
  }

  // Ingredient Controllers
  createIngredient = async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        stock,
        unit,
        reorderPoint,
        reorderAmount,
        cost,
        extraPrice,
        supplierId,
        userId,
      } = req.body;

      // Basic validation
      if (!name || !unit || !supplierId || !userId) {
        throw new AppError(400, 'Missing required fields');
      }

      // Validate unit is a valid MeasurementUnit
      if (!Object.values(MeasurementUnit).includes(unit)) {
        throw new AppError(400, 'Invalid measurement unit');
      }

      // Validate numeric values
      if (stock < 0 || reorderPoint < 0 || reorderAmount < 0 || cost < 0) {
        throw new AppError(400, 'Numeric values cannot be negative');
      }

      // Check if User exists
      if (!await this.customerService.findUser({ id: userId })) {
        throw new AppError(404, 'User not found');
      }

      const ingredient = await this.inventoryService.createIngredient({
        user: userId,
        name,
        description,
        stock: Number(stock),
        unit: unit as MeasurementUnit,
        reorderPoint: Number(reorderPoint),
        reorderAmount: Number(reorderAmount),
        cost: Number(cost),
        isExtra: extraPrice ? true : false,
        extraPrice: extraPrice ? Number(extraPrice) : null,
        supplierId,
      });

      res.status(201).json({
        status: 'success',
        data: ingredient,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, 'Failed to create ingredient');
    }
  };

  updateIngredient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId, ...updateData } = req.body;

      if (!userId) {
        throw new AppError(400, 'User ID is required');
      }

      // Check if User exists
      if (!await this.customerService.findUser({ id: userId })) {
        throw new AppError(404, 'User not found');
      }

      const ingredient = await this.inventoryService.updateIngredient({
        user: userId,
        id,
        ...updateData
      });

      res.status(200).json({
        status: 'success',
        data: ingredient,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, 'Failed to update ingredient');
    }
  };

  deleteIngredient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        throw new AppError(400, 'User ID is required');
      }

      if (!await this.customerService.findUser({ id: userId })) {
        throw new AppError(404, 'User not found');
      }

      await this.inventoryService.deleteIngredient({
        user: userId,
        id
      });

      res.status(204).send();
    } catch (error) {
      throw new AppError(400, 'Failed to delete ingredient');
    }
  };

  getIngredients = async (req: Request, res: Response) => {
    try {
      const ingredients = await this.inventoryService.getIngredients();
      res.status(200).json({
        status: 'success',
        data: ingredients,
      });
    } catch (error) {
      throw new AppError(400, 'Failed to get ingredients');
    }
  };

  getIngredient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ingredient = await this.inventoryService.getIngredient(id);
      
      if (!ingredient) {
        throw new AppError(404, 'Ingredient not found');
      }

      res.status(200).json({
        status: 'success',
        data: ingredient,
      });
    } catch (error) {
      throw new AppError(400, 'Failed to get ingredient');
    }
  };

  // Product Controllers
  createProduct = async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        categoryId,
        image,
        preparationTime,
        allergens,
        nutritionalInfo,
        price,
        ingredients,
        userId,
      } = req.body;

      if (!name || !categoryId || !price || !ingredients || !userId) {
        throw new AppError(400, 'Missing required fields');
      }

      if (!await this.customerService.findUser({ id: userId })) {
        throw new AppError(404, 'User not found');
      }

      const product = await this.inventoryService.createProduct({
        user: userId,
        name,
        description,
        categoryId,
        image,
        preparationTime: Number(preparationTime),
        allergens,
        nutritionalInfo,
        price: Number(price),
        isAvailable: true,
        ingredients,
      });

      res.status(201).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      throw new AppError(400, 'Failed to create product');
    }
  };

  updateProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId, ...updateData } = req.body;

      if (!userId) {
        throw new AppError(400, 'User ID is required');
      }

      if (!await this.customerService.findUser({ id: userId })) {
        throw new AppError(404, 'User not found');
      }

      const product = await this.inventoryService.updateProduct({
        id,
        user: userId,
        ...updateData,
      });

      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      throw new AppError(400, 'Failed to update product');
    }
  };

  deleteProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        throw new AppError(400, 'User ID is required');
      }

      await this.inventoryService.deleteProduct({
        user: userId,
        id
      });

      res.status(204).send();
    } catch (error) {
      throw new AppError(400, 'Failed to delete product');
    }
  };

  getProducts = async (req: Request, res: Response) => {
    try {
      const products = await this.inventoryService.getProducts();
      res.status(200).json({
        status: 'success',
        data: products,
      });
    } catch (error) {
      throw new AppError(400, 'Failed to get products');
    }
  };

  getProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = await this.inventoryService.getProduct(id);
      
      if (!product) {
        throw new AppError(404, 'Product not found');
      }

      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      throw new AppError(400, 'Failed to get product');
    }
  };

  // Category Controllers
  createCategory = async (req: Request, res: Response) => {
    try {
      const { name, description, userId } = req.body;

      if (!name || !userId) {
        throw new AppError(400, 'Missing required fields');
      }

      if (!await this.customerService.findUser({ id: userId })) {
        throw new AppError(404, 'User not found');
      }

      const category = await this.inventoryService.createCategory({
        user: userId,
        name,
        description,
      });

      res.status(201).json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      throw new AppError(400, 'Failed to create category');
    }
  };

  getCategories = async (req: Request, res: Response) => {
    try {
      const categories = await this.inventoryService.getCategories();
      res.status(200).json({
        status: 'success',
        data: categories,
      });
    } catch (error) {
      throw new AppError(400, 'Failed to get categories');
    }
  };
}