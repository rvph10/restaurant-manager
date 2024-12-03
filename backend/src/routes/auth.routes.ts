import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validatePassword } from '../middleware/password.validation';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
// Validate password for registration
router.use(validatePassword);
router.post('/register', authController.register);

export { router as authRoutes };
