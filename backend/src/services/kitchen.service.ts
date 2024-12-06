import { prisma } from '../prisma/client';
import { auditLog, logger } from '../lib/logging/logger';
import { Prisma } from '@prisma/client';

class ProductServiceError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

class ValidationError extends ProductServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

class MissingParameterError extends ProductServiceError {
  constructor(message: string) {
    super(message, 'MISSING_PARAMETER');
  }
}

class ResourceNotFoundError extends ProductServiceError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
  }
}

class DuplicateResourceError extends ProductServiceError {
  constructor(message: string) {
    super(message, 'DUPLICATE');
  }
}

export class KitchenService {
  private handleServiceError(error: unknown, context: string): never {
    logger.error(`Error in ProductService.${context}:`, {
      error,
      timestamp: new Date().toISOString(),
      context,
    });

    // If it's already our custom error, just rethrow it
    if (error instanceof ProductServiceError) {
      throw error;
    }

    // If it's a normal Error, convert it to our custom error
    if (error instanceof Error) {
      throw new ValidationError(error.message);
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new DuplicateResourceError('A record with this value already exists');
        case 'P2025':
          throw new ResourceNotFoundError('Record not found');
        case 'P2003':
          throw new ValidationError('Invalid relationship reference');
        case 'P2014':
          throw new ValidationError('Invalid data provided');
        default:
          throw new ProductServiceError(`Database error: ${error.message}`);
      }
    }

    throw new ProductServiceError('An unexpected error occurred');
  }
}
