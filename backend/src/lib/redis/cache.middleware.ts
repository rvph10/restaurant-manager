import { Request, Response, NextFunction, RequestHandler } from 'express';
import { redisManager } from './redis.manager';
import { generateCacheKey, getCacheTTL } from './cache.utils';
import { logger } from '../logging/logger';

export const cacheMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip caching for non-GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = generateCacheKey(req);

  try {
    // Try to get cached response
    const cachedResponse = await redisManager.get(cacheKey);

    if (cachedResponse) {
      logger.debug(`Cache hit for key: ${cacheKey}`);
      res.json(cachedResponse);
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function (body: any): Response {
      // Restore original res.json
      res.json = originalJson;

      // Cache the response before sending
      const ttl = getCacheTTL(req.path);
      redisManager.set(cacheKey, body, ttl)
        .catch(error => logger.error('Cache storage error:', error));

      logger.debug(`Cache miss for key: ${cacheKey}, storing with TTL: ${ttl}s`);
      
      // Send the response
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    logger.error('Cache middleware error:', error);
    next();
  }
};