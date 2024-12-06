import { Request, Response } from 'express';
import { MenuService } from '../services/menu.service';
import { MenuType, Weekday } from '@prisma/client';
import { logger } from '../lib/logging/logger';
import { AuthenticatedRequest } from '../types/express';
import { redisManager } from '../lib/redis/redis.manager';
import { CACHE_DURATIONS, CACHE_KEYS } from '../constants/cache';

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  private handleError(error: any, res: Response) {
    logger.error('MenuController Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    switch (error.code) {
      case 'VALIDATION_ERROR':
        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: error.message,
        });
      case 'NOT_FOUND':
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: error.message,
        });
      case 'DUPLICATE':
        res.status(409).json({
          status: 'error',
          code: 'DUPLICATE',
          message: error.message,
        });
      default:
        res.status(500).json({
          status: 'error',
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
    }
  }

  public getMenus = async (req: Request, res: Response) => {
    try {
      const cacheKey = `${CACHE_KEYS.MENUS}:${JSON.stringify(req.query)}`;
      const cachedData = await redisManager.get(cacheKey);
      if (cachedData) {
        res.json({
          status: 'success',
          data: JSON.parse(cachedData),
        });
        return;
      }
  
      const filters = {
        isActive: req.query.isActive === 'true' ? true : undefined,
        type: req.query.type as MenuType | undefined,
        isAvailable: req.query.isAvailable === 'true' ? true : undefined,
        isDayOfWeek: req.query.isDayOfWeek as Weekday | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };
  
      const result = await this.menuService.getMenus(filters);
      await redisManager.set(cacheKey, result, CACHE_DURATIONS.MENUS);
      
      res.json({
        status: 'success',
        data: result.data,
        total: result.total,
        pages: result.pages,
        currentPage: filters.page,
        hasMore: filters.page < result.pages
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const menu = await this.menuService.getMenu(req.params.id);
      res.json({
        status: 'success',
        data: menu,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public createMenu = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }
  
      const menu = await this.menuService.createMenu({
        ...req.body,
        user: req.user.id,
      });
  
      res.status(201).json({
        status: 'success',
        data: menu,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
  
  public updateMenu = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }
  
      const menu = await this.menuService.updateMenu(req.params.id, {
        ...req.body,
        user: req.user.id,
      });

      await redisManager.delete(`menus:*`);
    await redisManager.delete(`menu:${req.params.id}`);
  
      res.json({
        status: 'success',
        data: menu,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
  
  public deleteMenu = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({  // Added return statement
          status: 'error',
          message: 'Authentication required',
        });
        return;
      }
  
      await this.menuService.deleteMenu(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  };
}