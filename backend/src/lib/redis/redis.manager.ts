import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../logging/logger';

export class RedisManager {
  private static instance: RedisManager;
  private client: Redis;
  private subscribers: Map<string, (message: string) => void>;

  private constructor() {
    this.subscribers = new Map();
    this.client = this.createClient();
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private createClient(): Redis {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: null,
    };

    const client = new Redis(options);

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    client.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    client.on('close', () => {
      logger.warn('Redis client closed');
    });

    return client;
  }

  private async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Redis operation failed (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    throw lastError;
  }

  public async set(key: string, value: any, expiry?: number): Promise<void> {
    return this.withRetry(async () => {
      try {
        const serialized = JSON.stringify(value);
        if (expiry) {
          await this.client.setex(key, expiry, serialized);
        } else {
          await this.client.set(key, serialized);
        }

        // Add cache metadata
        await this.client.hset(`${key}:meta`, {
          createdAt: Date.now(),
          expiresAt: expiry ? Date.now() + expiry * 1000 : null,
          type: typeof value,
        });
      } catch (error) {
        logger.error('Redis set error:', error);
        throw error;
      }
    });
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  public async getMemoryUsage(): Promise<{
    usedMemory: number;
    peakMemory: number;
    totalKeys: number;
  }> {
    const info = await this.client.info('memory');
    const stats = info.split('\r\n').reduce((acc: any, line) => {
      const [key, value] = line.split(':');
      if (key && value) acc[key] = value;
      return acc;
    }, {});

    return {
      usedMemory: parseInt(stats['used_memory']) || 0,
      peakMemory: parseInt(stats['used_memory_peak']) || 0,
      totalKeys: parseInt((await this.client.dbsize()).toString()) || 0,
    };
  }

  async deletePattern(pattern: string, batchSize = 100): Promise<void> {
    return this.withRetry(async () => {
      try {
        let cursor = '0';
        do {
          const [newCursor, keys] = await this.client.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            batchSize
          );
          cursor = newCursor;

          if (keys.length > 0) {
            // Delete keys and their metadata
            const metaKeys = keys.map((key) => `${key}:meta`);
            await Promise.all([this.client.del(...keys), this.client.del(...metaKeys)]);
            logger.debug(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
          }
        } while (cursor !== '0');
      } catch (error) {
        logger.error('Redis pattern deletion error:', error);
        throw error;
      }
    });
  }

  public async get(key: string): Promise<any> {
    return this.withRetry(async () => {
      try {
        const [value, meta] = await Promise.all([
          this.client.get(key),
          this.client.hgetall(`${key}:meta`),
        ]);

        if (!value) return null;

        // Validate expiration
        if (meta.expiresAt && parseInt(meta.expiresAt) < Date.now()) {
          await this.delete(key);
          return null;
        }

        return JSON.parse(value);
      } catch (error) {
        logger.error('Redis get error:', error);
        throw error;
      }
    });
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  public async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      const subscriber = this.createClient();
      await subscriber.subscribe(channel);
      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(message);
        }
      });
      this.subscribers.set(channel, callback);
    } catch (error) {
      logger.error('Redis subscribe error:', error);
      throw error;
    }
  }

  public async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      logger.error('Redis publish error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      for (const [channel] of this.subscribers) {
        await this.client.unsubscribe(channel);
      }
      this.subscribers.clear();
    } catch (error) {
      logger.error('Redis disconnect error:', error);
      throw error;
    }
  }
}

export const redisManager = RedisManager.getInstance();
