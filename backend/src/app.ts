import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

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
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api', router);

  // 404 handler - should come after routes
  app.use('*', notFoundHandler);

  // Error handler - should be last
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
  });

  return app;
};
