import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../middleware/error.handler';
import { LoginCredentials, RegisterData } from '../interfaces/auth.interface';
import { logger } from '../lib/logging/logger';
import { AuthenticatedRequest } from '../types/express';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Registration request received');
      const data: RegisterData = req.body;

      // Validate input
      if (!data.email || !data.password || !data.firstName || !data.lastName || !data.phone) {
        logger.warn('Missing required fields');
        throw new AppError(400, 'All fields are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        logger.warn('Invalid email format');
        throw new AppError(400, 'Invalid email format');
      }

      // Validate password strength
      if (data.password.length < 8) {
        logger.warn('Password too short');
        throw new AppError(400, 'Password must be at least 8 characters long');
      }

      logger.info('Calling auth service register');
      const result = await this.authService.register(data);

      logger.info('Registration successful');
      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logger.error('Controller error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials: LoginCredentials = req.body;

      if (!credentials.email || !credentials.password) {
        throw new AppError(400, 'Email and password are required');
      }

      const result = await this.authService.login(credentials);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  };
  public logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            throw new AppError(401, 'Not authenticated');
        }
        await this.authService.logout(req.user.id);
        res.status(200).json({
            status: 'success',
            message: 'Successfully logged out'
        });
    } catch (error) {
        next(error);
    }
};
}
