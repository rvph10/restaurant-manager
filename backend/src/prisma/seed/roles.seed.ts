import { PrismaClient, Permission, Role } from '@prisma/client';
import { logger } from '../../lib/logging/logger';

const prisma = new PrismaClient();

// Define role configurations
const roleConfigs = [
  {
    id: 'SUPER_ADMIN',
    name: 'SUPER_ADMIN',
    description: 'Super administrator with full system access',
    // Gets all permissions
  },
  {
    id: 'ADMIN',
    name: 'ADMIN',
    description: 'Administrator with full restaurant access',
    permissionFilter: () => true, // All permissions
  },
  {
    id: 'MANAGER',
    name: 'MANAGER',
    description: 'Restaurant manager with elevated access',
    permissionFilter: (p: Permission) =>
      !p.name.includes('delete') && !p.name.includes('user:create'),
  },
  {
    id: 'STAFF',
    name: 'STAFF',
    description: 'Regular staff member',
    permissionFilter: (p: Permission) =>
      p.name.includes('read') || p.name.includes('order:') || p.name.includes('product:read'),
  },
];

export async function seedRoles() {
  logger.info('🔑 Seeding roles...');

  try {
    // Get all permissions
    const permissions = await prisma.permission.findMany();
    if (!permissions.length) {
      throw new Error('No permissions found. Please seed permissions first.');
    }

    const roles: Role[] = [];

    for (const config of roleConfigs) {
      // Determine permissions for this role
      const rolePermissions = permissions.filter(config.permissionFilter || (() => true));

      // Create or update role
      const role = await prisma.role.upsert({
        where: { id: config.id },
        update: {
          description: config.description,
          permissions: {
            // Recreate all permissions
            deleteMany: {},
            create: rolePermissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
        create: {
          name: config.name,
          description: config.description,
          permissions: {
            create: rolePermissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      roles.push(role);
    }

    logger.info('🔑 Roles seeded successfully');
    return roles;
  } catch (error) {
    logger.error('🔑 Error seeding roles:', error);
    throw error;
  }
}
