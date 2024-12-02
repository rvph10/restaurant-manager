import { Router } from 'express';
import { inventoryRoutes } from './inventory.routes';
import { authRoutes } from './auth.routes';
import { employeeRoutes } from './employee.routes';

const router = Router();

router.use('/inventory', inventoryRoutes);
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);

export { router };
