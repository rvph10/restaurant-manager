import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validatePassword } from '../middleware/password.validation';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/register', validatePassword, authController.register);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', validatePassword, authController.resetPassword);
router.get('/csrf', (req, res) => {
  res.json({ csrfToken: req.session.csrf });
});

export { router as authRoutes };
