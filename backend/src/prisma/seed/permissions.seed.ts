import { PrismaClient, Permission } from '@prisma/client';
import { PERMISSIONS } from '../../constants/permission';
import crypto from 'crypto';
import { logger } from '../../lib/logging/logger';

const prisma = new PrismaClient();

export async function seedPermissions() {
  logger.info('🧢 Seeding permissions...');

  const permissions: Permission[] = [];

  try {
    for (const value of Object.values(PERMISSIONS)) {
      // Generate a random hash for the permission
      const hash = crypto.createHash('sha256').update(value).digest('hex');

      const permission = await prisma.permission.create({
        data: {
          name: value,
          hash: hash,
          description: `Permission to ${value.split(':')[1]} ${value.split(':')[0]}`,
        },
      });
      permissions.push(permission);
    }
    logger.info('🧢 Permissions seeded successfully');
  } catch (error) {
    throw error;
  }
}
