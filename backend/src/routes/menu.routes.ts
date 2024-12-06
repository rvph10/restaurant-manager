// src/routes/menu.routes.ts

import { Router, Response, NextFunction, RequestHandler } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/permission.middleware';
import { PERMISSIONS } from '../constants/permission';
import { AuthenticatedRequest } from '../types/express';

const router = Router();
const menuController = new MenuController();

// Helper function to wrap controller methods
const wrapHandler = (
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    return handler(req as AuthenticatedRequest, res).catch(next);
  };
};

// Public routes
router.get('/', wrapHandler(menuController.getMenus));
router.get('/:id', wrapHandler(menuController.getMenu));

// Protected routes
router.post(
  '/',
  authenticate,
  hasPermission(PERMISSIONS.MENU_CREATE),
  wrapHandler(menuController.createMenu)
);

router.put(
  '/:id',
  authenticate,
  hasPermission(PERMISSIONS.MENU_UPDATE),
  wrapHandler(menuController.updateMenu)
);

router.delete(
  '/:id',
  authenticate,
  hasPermission(PERMISSIONS.MENU_DELETE),
  wrapHandler(menuController.deleteMenu)
);

export { router as menuRoutes };