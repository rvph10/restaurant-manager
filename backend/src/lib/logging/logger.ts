import { createLogger, format, transports } from 'winston';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../prisma/client';

const { combine, timestamp, printf, colorize, errors } = format;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, correlationId, ...metadata }) => {
  let meta = '';
  if (Object.keys(metadata).length) {
    meta = '\n' + JSON.stringify(metadata, null, 2);
  }
  const correlationStr = correlationId ? ` [${correlationId}]` : '';
  return `${timestamp} [${level}]${correlationStr}: ${message}${meta}`;
});

// Define which logging level to use based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Create the logger instance
export const logger = createLogger({
  level: level(),
  levels,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize({ all: true }),
    logFormat
  ),
  transports: [
    // Console transport
    new transports.Console(),

    // // Error log file transport
    // // Stopped writing the log
    // new transports.File({
    //   filename: 'logs/error.log',
    //   level: 'error',
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 5,
    // }),

    // // Combined log file transport
    // new transports.File({
    //   filename: 'logs/combined.log',
    //   maxsize: 5242880,
    //   maxFiles: 5,
    // }),
  ],
});

// Add colors to Winston
format.colorize().addColors(colors);

// Error logging utility
export const logError = (error: Error, context: Record<string, any>) => {
  const correlationId = uuid();
  logger.error({
    correlationId,
    message: error.message,
    stack: error.stack,
    ...context,
  });
  return correlationId;
};

// Audit logging utility
export const auditLog = async (action: string, details: any, userId?: string) => {
  const correlationId = uuid();
  try {
    const auditDetails = {
      ...details,
      correlationId,
      timestamp: new Date(),
    };

    await prisma.auditLog.create({
      data: {
        action,
        details: auditDetails,
        userId,
        timestamp: new Date(),
      },
    });

    logger.info(`Audit log created: ${action}`, {
      correlationId,
      userId,
      action,
    });

    return correlationId;
  } catch (error) {
    logger.error('Failed to create audit log:', {
      error,
      action,
      details,
      userId,
      correlationId,
    });
    throw error;
  }
};

// Type definitions for the logger
export type LogLevel = keyof typeof levels;

// Helper functions for consistent logging
export const logMessage = {
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },
  error: (message: string, error: Error, meta?: Record<string, any>) => {
    return logError(error, { message, ...meta });
  },
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },
  http: (message: string, meta?: Record<string, any>) => {
    logger.http(message, meta);
  },
};
