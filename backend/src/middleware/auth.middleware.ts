import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './error.handler';
import { JwtPayload } from '../interfaces/auth.interface';
import { AuthenticatedRequest } from '../types/express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    roles: string[];
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authorization required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    req.user = {
      id: decoded.userId,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
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
