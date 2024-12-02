import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logging/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error caught in error handler:', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: { ...req.body, password: '[REDACTED]' },
  });

  // Handle Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'A record with this value already exists.',
        error: process.env.NODE_ENV === 'development' ? err : undefined,
      });
    }
    return res.status(400).json({
      status: 'error',
      message: 'Database operation failed',
      error: process.env.NODE_ENV === 'development' ? err : undefined,
    });
  }

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle other errors
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};
