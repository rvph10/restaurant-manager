import { prisma } from '../prisma/client';
import { Order, Prisma } from '@prisma/client';
import { logger, auditLog } from '../lib/logging/logger';
import { OrderDataInput } from '../interfaces/order.interface';
import {
  hasValidLength,
  isPositiveNumber,
  isValidEmail,
  isValidPhoneNumber,
  isValidUUID,
} from '../utils/valid';

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

export class OrderService {
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

  private validateOrderData(data: OrderDataInput): void {
    if (!data) {
      throw new MissingParameterError('Order data is required');
    }

    if (!hasValidLength(data.orderNumber, 1, 50)) {
      throw new ValidationError('Order number must be between 1 and 50 characters');
    }

    if (!isValidUUID(data.customerId)) {
      throw new ValidationError('Invalid customer ID');
    }

    if (!data.type) {
      throw new ValidationError('Order type is required');
    }
    
  }

  async createOrder(data: OrderDataInput): Promise<void> {
    try {
        this.validateOrderData(data);
    } catch (error) {
        
    }
  }
}
