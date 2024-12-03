import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './error.handler';
import { JwtPayload } from '../interfaces/auth.interface';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authorization required');
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    console.log('Decoded token:', decoded);

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid token:', error.message);
      throw new AppError(401, 'Invalid token');
    }
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authorization required');
    }

    if (!roles.some((role) => req.user!.roles.includes(role))) {
      throw new AppError(403, 'Insufficient permissions');
    }

    next();
  };
};
