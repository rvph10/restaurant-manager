import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  database: {
    url: process.env.DATABASE_URL,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
  },
};
