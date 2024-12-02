import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validatePassword } from '../middleware/password.validation';

const router = Router();
const authController = new AuthController();
router.post('/login', authController.login);
// Validate password for registration
router.use(validatePassword);
router.post('/register', authController.register);

export { router as authRoutes };
