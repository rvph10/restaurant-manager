import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { employeeRoutes } from './employee.routes';
import { productRoutes } from './product.routes';
import { dbStatsRouter } from './db.stats.routes';
import { menuRoutes } from './menu.routes';
import { orderRoutes } from './order.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/employees', employeeRoutes);
router.use('/db-stats', dbStatsRouter);
router.use('/menus', menuRoutes);
router.use('/orders', orderRoutes);

export { router };
