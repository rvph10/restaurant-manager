import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router } from './routes/index.routes';
import compression from 'compression';
import { errorHandler, AppError } from './middleware/error.handler';
import { notFoundHandler } from './middleware/notFound.handler';
import { requestLogger } from './middleware/request.logger';

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

  // Health Check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api', router);

  // Error Handling
  app.use(notFoundHandler);
  app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
  });

  return app;
};
