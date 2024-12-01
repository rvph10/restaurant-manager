import { Router } from 'express';
import { inventoryRoutes } from './inventory.routes';

const router = Router();

router.use('/inventory', inventoryRoutes);

export { router };
