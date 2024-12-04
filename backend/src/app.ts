import express, { Express, Request, Response, NextFunction } from 'express';
import { enhanceSession, validateCsrf } from './middleware/session.enhancement';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { prisma } from './prisma/client';
import helmet from 'helmet';
import session from 'express-session';
import { sessionConfig } from './config/session';
import { router } from './routes/index.routes';
import compression from 'compression';
import { errorHandler } from './middleware/error.handler';
import { notFoundHandler } from './middleware/notFound.handler';
import { requestLogger } from './middleware/request.logger';
import { logger } from './lib/logging/logger';

export const createApp = (): Express => {
  const app = express();

  // Global Middlewares
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", process.env.CORS_ORIGIN || 'http://localhost:3000'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    })
  );
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(cookieParser());
  app.use(session(sessionConfig));
  app.use(session(sessionConfig));
  app.use(enhanceSession as express.RequestHandler);
  app.use(validateCsrf as express.RequestHandler);

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  });

  // Health Check
  app.get('/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      });
    }
  });

  // API Routes with caching
  app.use('/api', router);

  // Error handler - should be last
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Error caught:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
    });

    errorHandler(err, req, res, next);
  });

  // 404 handler - should come after routes
  app.use(notFoundHandler);

  return app;
};
