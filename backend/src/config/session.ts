import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './redis';

export const sessionConfig = {
  store: new RedisStore({
    client: redisClient,
    prefix: 'session:',
  }),
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
