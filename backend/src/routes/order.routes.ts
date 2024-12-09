import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/permission.middleware';
import { PERMISSIONS } from '../constants/permission';

const router = Router();
const orderController = new OrderController();

// Create order route
router.post(
  '/',
  authenticate,
  hasPermission(PERMISSIONS.ORDER_CREATE),
  orderController.createOrder
);

export { router as orderRoutes };