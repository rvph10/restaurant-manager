import { PrismaClient } from '@prisma/client';
import { logger } from '../../lib/logging/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();