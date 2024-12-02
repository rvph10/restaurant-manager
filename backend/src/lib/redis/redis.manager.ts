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

  public getClient(): Redis {
    return this.client;
  }

  public async set(key: string, value: any, expiry?: number): Promise<void> {
    try {
      if (expiry) {
        await this.client.setex(key, expiry, JSON.stringify(value));
      } else {
        await this.client.set(key, JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  public async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
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