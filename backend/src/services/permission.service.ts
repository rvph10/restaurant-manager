import { Permission, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { logger } from '../lib/logging/logger';
import { auditLog } from '../lib/logging/logger';
import { PERMISSIONS } from '../constants/permission';
import crypto from 'crypto';
import { invalidateUserPermissionCache } from '../middleware/permission.middleware';
import { AssignPermissionInput, CreatePermissionInput } from '../interfaces/permission.interface';
import { AppError } from '../middleware/error.handler';

export class PermissionService {
  private generatePermissionHash(permissionName: string): string {
    return crypto.createHash('sha256').update(permissionName).digest('hex');
  }

  private async checkPermissionExists(permission: string): Promise<boolean> {
    try {
      return permission in PERMISSIONS;
    } catch (error) {
      logger.error('Error checking permission:', error);
      throw error;
    }
  }

  async createPermission(data: CreatePermissionInput): Promise<Permission> {
    try {
      // Check if permission already exists
      if (!(await this.checkPermissionExists(data.name)))
        throw new Error('Permission does not exist');
      const existingPermission = await prisma.permission.findFirst({
        where: { name: data.name },
      });
      if (existingPermission) {
        throw new Error('Permission already exists');
      }

      const permission = await prisma.permission.create({
        data: {
          name: data.name,
          description: data.description,
          hash: this.generatePermissionHash(data.name),
        },
      });

      await auditLog(
        'CREATE_PERMISSION',
        {
          permissionName: data.name,
          permissionId: permission.id,
        },
        data.user || 'SYSTEM'
      );

      return permission;
    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  async getPermissions(): Promise<Permission[]> {
    try {
      return await prisma.permission.findMany();
    } catch (error) {
      logger.error('Error getting permissions:', error);
      throw error;
    }
  }

  async getPermissionById(permissionId: string): Promise<Permission | null> {
    try {
      return await prisma.permission.findUnique({
        where: { id: permissionId },
      });
    } catch (error) {
      logger.error('Error getting permission by ID:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Internal server error');
    }
  }

  async assignPermissionsToRole(data: AssignPermissionInput): Promise<void> {
    try {
      // Verify role exists
      const role = await prisma.role.findUnique({
        where: { id: data.roleId },
        include: { employeeRoles: true },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // Verify all permissions exist
      const permissions = await prisma.permission.findMany({
        where: { id: { in: data.permissions } },
      });

      if (permissions.length !== data.permissions.length) {
        throw new Error('One or more permissions not found');
      }

      await prisma.$transaction(async (tx) => {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: data.roleId },
        });

        // Assign new permissions
        await tx.rolePermission.createMany({
          data: data.permissions.map((permissionId) => ({
            roleId: data.roleId,
            permissionId,
          })),
        });

        // Invalidate cache for all users with this role
        for (const employeeRole of role.employeeRoles) {
          await invalidateUserPermissionCache(employeeRole.employeeId);
        }
      });

      await auditLog(
        'ASSIGN_PERMISSIONS',
        {
          roleId: data.roleId,
          permissions: data.permissions,
        },
        data.user || 'SYSTEM'
      );
    } catch (error) {
      logger.error('Error assigning permissions:', error);
      throw error;
    }
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    try {
      const permissions = await prisma.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
      });

      return permissions.map((rp) => rp.permission);
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      throw error;
    }
  }
}
