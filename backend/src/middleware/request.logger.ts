import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logging/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      duration: `${duration}ms`,
      status: res.statusCode,
      ip: req.ip,
    });
  });

  next();
};
