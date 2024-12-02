import Redis from 'ioredis';
import { logger } from '../lib/logging/logger';

const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_RETRY_ATTEMPTS = 10;
const INITIAL_RETRY_DELAY = 50;
const MAX_RETRY_DELAY = 2000;

const createRedisClient = () => {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times) => {
      if (times > MAX_RETRY_ATTEMPTS) {
        logger.error('Max Redis retry attempts reached. Stopping retries.');
        return null;
      }
      const delay = Math.min(times * INITIAL_RETRY_DELAY, MAX_RETRY_DELAY);
      logger.info(`Retrying Redis connection in ${delay}ms...`);
      return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    }
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  redis.on('connect', () => {
    logger.info('Attempting to connect to Redis...');
  });

  redis.on('ready', async () => {
    logger.info('Successfully connected to Redis and ready to accept commands');
  });

  redis.on('reconnecting', () => {
    logger.warn('Reconnecting to Redis...');
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('end', () => {
    logger.error('Redis connection ended');
  });

  // Session cleanup
  const cleanupSessions = async () => {
    try {
      const keys = await redis.keys('sess:*');
      let expiredCount = 0;
      
      for (const key of keys) {
        const session = await redis.get(key);
        if (session) {
          const sessionData = JSON.parse(session);
          if (sessionData.cookie && new Date(sessionData.cookie.expires) < new Date()) {
            await redis.del(key);
            expiredCount++;
          }
        }
      }
      
      if (expiredCount > 0) {
        logger.info(`Cleaned up ${expiredCount} expired sessions`);
      }
    } catch (err) {
      logger.error('Session cleanup error:', err);
    }
  };

  redis.on('ready', () => {
    // Initial cleanup
    cleanupSessions();
    
    // Schedule periodic cleanup
    setInterval(cleanupSessions, CLEANUP_INTERVAL);
  });

  return redis;
};

// Create singleton instance
let redisInstance: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  return redisInstance;
};

export const redisClient = getRedisClient();