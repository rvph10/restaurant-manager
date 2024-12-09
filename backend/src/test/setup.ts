// backend/src/test/setup.ts
import { jest } from '@jest/globals';

// Mock PrismaClient
jest.mock('../prisma/client');

// Mock Redis Manager
jest.mock('../lib/redis/redis.manager');

// Mock Logger
jest.mock('../lib/logging/logger');
