import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.handler';

export const validatePassword = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError(400, 'Password is required');
  }

  // Minimum length of 8 characters
  if (password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters long');
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    throw new AppError(400, 'Password must contain at least one uppercase letter');
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    throw new AppError(400, 'Password must contain at least one lowercase letter');
  }

  // At least one number
  if (!/\d/.test(password)) {
    throw new AppError(400, 'Password must contain at least one number');
  }

  // At least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new AppError(400, 'Password must contain at least one special character');
  }

  next();
};
