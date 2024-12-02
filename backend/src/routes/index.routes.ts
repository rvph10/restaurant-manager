import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { employeeRoutes } from './employee.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);

export { router };
