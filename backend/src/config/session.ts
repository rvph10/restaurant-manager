import { createClient } from 'redis';
import session from 'express-session';
import { RedisStore } from 'connect-redis';

// Initialize Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
});

redisClient.connect().catch(console.error);

// Initialize RedisStore
export const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'session:',
});

export const sessionConfig: session.SessionOptions = {
  store: redisStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};
