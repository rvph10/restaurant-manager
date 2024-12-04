import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { employeeRoutes } from './employee.routes';
import { productRoutes } from './product.routes';
import { dbStatsRouter } from './db.stats.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/employees', employeeRoutes);
router.use('/db-stats', dbStatsRouter);

export { router };
