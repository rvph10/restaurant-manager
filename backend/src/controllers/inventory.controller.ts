import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { AppError } from '../middleware/error.handler';
import { MeasurementUnit } from '@prisma/client';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

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

      const ingredient = await this.inventoryService.createIngredient({
        user: userId,  // Pass the user ID
        name,
        description,
        stock: Number(stock),
        unit: unit as MeasurementUnit,
        reorderPoint: Number(reorderPoint),
        reorderAmount: Number(reorderAmount),
        cost: Number(cost),
        isExtra: extraPrice ? true : false,  // Calculate isExtra based on extraPrice
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
}