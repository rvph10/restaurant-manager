import { prisma } from '../prisma/client';
import { auditLog, logger } from '../lib/logging/logger';
import {
  CreateStationInput,
  StationFilters,
  UpdateStationInput,
} from '../interfaces/kitchen.interface';
import { Prisma, Station, StationType } from '@prisma/client';
import { hasValidLength, isValidUUID } from '../utils/valid';
import { RedisKeyBuilder } from '../lib/redis/redis.utils';
import { redisManager } from '../lib/redis/redis.manager';
import { CACHE_DURATIONS } from '../constants/cache';

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

  private validateCreateStation(data: CreateStationInput) {
    if (!data.name) {
      throw new MissingParameterError('Name is required');
    }

    if (!data.type) {
      throw new MissingParameterError('Type is required');
    }

    if (!data.displayLimit) {
      throw new MissingParameterError('Display limit is required');
    }

    if (!data.maxCapacity) {
      throw new MissingParameterError('Max capacity is required');
    }

    if (data.isActive === undefined) {
      throw new MissingParameterError('isActive is required');
    }

    if (data.isIndependent === undefined) {
      throw new MissingParameterError('isIndependent is required');
    }

    if (!Number.isInteger(data.displayLimit)) {
      throw new ValidationError('Display limit must be an integer');
    }

    if (!Number.isInteger(data.maxCapacity)) {
      throw new ValidationError('Max capacity must be an integer');
    }

    if (!Number.isInteger(data.isActive)) {
      throw new ValidationError('isActive must be an integer');
    }

    if (!Number.isInteger(data.isIndependent)) {
      throw new ValidationError('isIndependent must be an integer');
    }

    if (data.displayLimit < 1) {
      throw new ValidationError('Display limit must be a positive integer');
    }

    if (data.maxCapacity < 0) {
      throw new ValidationError('Max capacity must be a positive integer');
    }

    if (!hasValidLength(data.name, 1, 30)) {
      throw new ValidationError('Name must be between 1 and 30 characters');
    }

    if (!Object.values(StationType).includes(data.type)) {
      throw new ValidationError('Invalid station type');
    }
  }

  private validateUpdateStation(data: UpdateStationInput) {
    if (!data.id) {
      throw new MissingParameterError('ID is required');
    }

    if (data.displayLimit !== undefined && !Number.isInteger(data.displayLimit)) {
      throw new ValidationError('Display limit must be an integer');
    }

    if (!isValidUUID(data.id)) {
      throw new ValidationError('Invalid ID');
    }

    if (data.name && !hasValidLength(data.name, 1, 30)) {
      throw new ValidationError('Name must be between 1 and 30 characters');
    }

    if (data.type && !Object.values(StationType).includes(data.type)) {
      throw new ValidationError('Invalid station type');
    }

    if (data.displayLimit && data.displayLimit < 1) {
      throw new ValidationError('Display limit must be a positive integer');
    }

    if (data.maxCapacity && data.maxCapacity < 0) {
      throw new ValidationError('Max capacity must be a positive integer');
    }
  }

  private async checkStationExists(params: { id?: string; name?: string }): Promise<boolean> {
    try {
      if (!params.id && !params.name) {
        throw new MissingParameterError('At least one parameter (id or name) must be provided');
      }

      const whereClause: Prisma.StationWhereInput = {
        OR: [],
      };

      if (params.id) {
        whereClause.OR!.push({ id: params.id });
      }
      if (params.name) {
        whereClause.OR!.push({
          name: {
            equals: params.name,
            mode: 'insensitive', // Case insensitive search
          },
        });
      }

      const station = await prisma.station.findFirst({
        where: whereClause,
      });

      return !!station;
    } catch (error) {
      return this.handleServiceError(error, 'checkStationExists');
    }
  }

  private async invalidateStationCache(): Promise<void> {
    try {
      const patterns = ['station:detail:*', 'station:list:*', 'station:exists:*'];
      await Promise.all(patterns.map((patterns) => redisManager.deletePattern(patterns)));
      logger.info('Station cache invalidated');
    } catch (error) {
      return this.handleServiceError(error, 'invalidateStationCache');
    }
  }

  async createStation(data: CreateStationInput): Promise<Station> {
    try {
      this.validateCreateStation(data);
      if (await this.checkStationExists({ name: data.name })) {
        throw new DuplicateResourceError('A station with this name already exists');
      }
      const station = await prisma.station.create({
        data: {
          icon: data.icon,
          name: data.name,
          type: data.type,
          stepOrder: data.stepOrder,
          displayLimit: data.displayLimit,
          seenCategory: data.seenCategory,
          maxCapacity: data.maxCapacity,
          isActive: data.isActive ?? true,
          isIndependent: data.isIndependent ?? false,
        },
      });

      logger.info('Station created:', {
        stationId: station.id,
        name: station.name,
        type: station.type,
      });

      auditLog(
        'CREATE_STATION',
        {
          stationId: station.id,
          name: station.name,
          type: station.type,
        },
        data.user || 'SYSTEM'
      );
      await this.invalidateStationCache();
      return station;
    } catch (error) {
      return this.handleServiceError(error, 'createStation');
    }
  }

  async updateStation(data: UpdateStationInput): Promise<Station> {
    try {
      this.validateUpdateStation(data);
      if (!(await this.checkStationExists({ id: data.id }))) {
        throw new ResourceNotFoundError('Station not found');
      }
      const station = await prisma.station.update({
        where: {
          id: data.id,
        },
        data: {
          icon: data.icon,
          name: data.name,
          type: data.type,
          displayLimit: data.displayLimit,
          stepOrder: data.stepOrder,
          seenCategory: data.seenCategory,
          maxCapacity: data.maxCapacity,
          isActive: data.isActive,
          isIndependent: data.isIndependent,
        },
      });

      logger.info('Station updated:', {
        stationId: station.id,
        name: station.name,
        type: station.type,
      });

      auditLog(
        'UPDATE_STATION',
        {
          stationId: station.id,
          name: station.name,
          type: station.type,
        },
        data.user || 'SYSTEM'
      );
      await this.invalidateStationCache();
      return station;
    } catch (error) {
      return this.handleServiceError(error, 'updateStation');
    }
  }

  async getStations(): Promise<Station[]> {
    try {
      const cacheKey = RedisKeyBuilder.station.list({});
      const cached = await redisManager.get(cacheKey);

      if (cached && Array.isArray(cached) && cached.length > 0) {
        logger.debug(`Cache hit for stations list with ${cached.length} stations`);
        return cached;
      }

      const stations = await prisma.station.findMany({
        orderBy: { stepOrder: 'asc' },
      });

      if (stations.length > 0) {
        await redisManager.set(cacheKey, stations, CACHE_DURATIONS.STATIONS);
        logger.debug(`Cached ${stations.length} stations`);
      }

      return stations;
    } catch (error) {
      logger.error('Error in getStations:', error);
      return this.handleServiceError(error, 'getStations');
    }
  }

  async getStation(data: StationFilters): Promise<Station[]> {
    try {
      const stations = await prisma.station.findMany({
        where: {
          isActive: data.isActive,
          type: data.type,
          isIndependent: data.isIndependent,
        },
      });

      return stations;
    } catch (error) {
      return this.handleServiceError(error, 'getStation');
    }
  }

  async deleteStation(id: string, user: string): Promise<void> {
    try {
      if (!isValidUUID(id)) {
        throw new ValidationError('Invalid station ID');
      }

      const station = await prisma.station.findUnique({
        where: { id },
        include: { queueItems: true },
      });

      if (!station) {
        throw new ResourceNotFoundError('Station not found');
      }

      // Check if station has active queue items
      if (station.queueItems.length > 0) {
        throw new ValidationError('Cannot delete station with active queue items');
      }

      await prisma.station.delete({ where: { id } });

      await auditLog(
        'DELETE_STATION',
        {
          stationId: id,
          name: station.name,
          type: station.type,
        },
        user
      );
    } catch (error) {
      return this.handleServiceError(error, 'deleteStation');
    }
  }
}
