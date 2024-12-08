import { Response } from 'express';
import { OrderService } from '../services/order.service';
import { AuthenticatedRequest } from '../types/express';
import { logger } from '../lib/logging/logger';
import { AppError } from '../middleware/error.handler';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  private handleError(error: any, res: Response) {
    logger.error('OrderController Error:', {
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

  public createOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }

      const order = await this.orderService.createOrder({
        ...req.body,
        user: req.user.id,
      });

      res.status(201).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}