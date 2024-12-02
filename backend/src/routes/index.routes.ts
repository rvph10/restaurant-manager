import { Router } from 'express';
import { inventoryRoutes } from './inventory.routes';
import { authRoutes } from './auth.routes';

const router = Router();

router.use('/inventory', inventoryRoutes);
router.use('/auth', authRoutes);

export { router };
