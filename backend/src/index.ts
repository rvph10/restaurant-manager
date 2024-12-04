import { config } from 'dotenv';
import { createApp } from './app';
import { prisma } from './prisma/client';
import { SessionService } from './services/session.service';
import { logger } from './lib/logging/logger';
import http from 'http';

// Load environment variables
config();

const port = process.env.PORT || 5000;

const cleanup = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Cleaned up database and Redis connections');
  } catch (error) {
    logger.error('Error during cleanup:', error);
  }
};

const handleShutdown = async (server: http.Server) => {
  logger.info('Shutdown signal received');

  server.close(async () => {
    logger.info('HTTP server closed');
    await cleanup();
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000);
};

// Add global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Successfully connected to database');

    const app = createApp();
    const server = http.createServer(app);

    server.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      SessionService.startCleanup(); // Add this line
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => handleShutdown(server));
    process.on('SIGINT', () => handleShutdown(server));
  } catch (error) {
    logger.error('Unable to start server:', error);
    await cleanup();
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  logger.error('Unhandled error during bootstrap:', error);
  process.exit(1);
});
