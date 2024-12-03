import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { employeeRoutes } from './employee.routes';
import { productRoutes } from './product.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/employees', employeeRoutes);

export { router };
