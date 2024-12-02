import { Request } from 'express';
import crypto from 'crypto';

export const generateCacheKey = (req: Request): string => {
  const { baseUrl, path, method, query, body } = req;

  // Create a string combining relevant request properties
  const keyString = JSON.stringify({
    baseUrl,
    path,
    method,
    query,
    body,
  });

  // Generate SHA-256 hash of the string
  return crypto.createHash('sha256').update(keyString).digest('hex');
};

export const getCacheTTL = (path: string): number => {
  // Define cache duration for different routes (in seconds)
  const cacheDurations: Record<string, number> = {
    '/api/products': 3600, // 1 hour
    '/api/categories': 3600,
    '/api/ingredients': 1800, // 30 minutes
    '/api/inventory': 300, // 5 minutes
  };

  // Return specified duration or default to 5 minutes
  return cacheDurations[path] || 300;
};
