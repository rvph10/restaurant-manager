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

const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError) => {
  logger.error('Prisma error:', {
    code: error.code,
    meta: error.meta,
    message: error.message
  });

  switch (error.code) {
    case 'P2002':
      return new AppError(409, 'A record with this value already exists');
    case 'P2025':
      return new AppError(404, 'Record not found');
    default:
      return new AppError(500, `Database error: ${error.message}`);
  }
};

export const errorHandler = (
  err: Error | AppError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error caught in error handler:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const error = handlePrismaError(err);
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Unexpected errors
  logger.error('Unexpected error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred'
  });
};