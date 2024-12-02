import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../middleware/error.handler';
import { logger } from '../lib/logging/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      logger.info('Registration attempt:', {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      });

      const { email, password, firstName, lastName, phone } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName || !phone) {
        throw new AppError(400, 'Missing required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError(400, 'Invalid email format');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new AppError(400, 'Password must be at least 8 characters long');
      }

      const { employee, token } = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
        phone
      });

      // Remove password from response
      const { password: _, ...employeeData } = employee;

      logger.info('Registration successful:', {
        userId: employee.id,
        email: employee.email
      });

      res.status(201).json({
        status: 'success',
        data: {
          employee: employeeData,
          token
        }
      });
    } catch (error: unknown) {
      logger.error('Registration failed:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body
      });

      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.message === 'User already exists') {
        throw new AppError(409, 'Email or phone already registered');
      }
      throw new AppError(500, 'Registration failed');
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        throw new AppError(400, 'Email and password are required');
      }
  
      const { employee, token } = await this.authService.login(email, password);
  
      // Remove sensitive data
      const { password: _, ...employeeData } = employee;
  
      res.status(200).json({
        status: 'success',
        data: {
          user: employeeData,
          token
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        throw new AppError(401, 'Invalid email or password');
      }
      throw new AppError(500, 'Login failed');
    }
  };
}