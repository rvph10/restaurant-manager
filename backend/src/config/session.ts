import { createClient } from 'redis';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import crypto from 'crypto';

const THIRTY_MINUTES = 30 * 60 * 1000;
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Too many retries on Redis');
      }
      return Math.min(retries * 50, 2000);
    }
  }
});

redisClient.connect().catch(console.error);

export const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
  ttl: TWELVE_HOURS / 1000, // Redis expects seconds
});

export const sessionConfig: session.SessionOptions = {
  store: redisStore,
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  name: 'sid', // Change from default 'connect.sid'
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on every response
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: THIRTY_MINUTES,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
  },
  proxy: process.env.NODE_ENV === 'production'
};