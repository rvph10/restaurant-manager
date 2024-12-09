import { Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { AppError } from './error.handler';
import { Permission } from '../constants/permission';
import { AuthenticatedRequest } from '../types/express';
import crypto from 'crypto';
import { auditLog } from '../lib/logging/logger';
import { Employee, EmployeeRole, Role, RolePermission } from '@prisma/client';
import { redisManager } from '../lib/redis/redis.manager';

const CACHE_TTL = 300; // 5 minutes

// Define proper nested types based on Prisma schema
interface EmployeeWithRoles extends Employee {
  roles: (EmployeeRole & {
    role: Role & {
       permissions: (RolePermission & {
        permission: {
          id: string;
          name: string;
          hash: string;
        };
      })[];
    };
  })[];
}

function sanitizeInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9:_-]/g, '');
}

function verifyPermissionHash(permission: string, storedHash: string): boolean {
  const sanitizedPermission = sanitizeInput(permission);
  const computedHash = crypto.createHash('sha256').update(sanitizedPermission).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
}

async function getUserPermissions(userId: string): Promise<string[]> {
  const cacheKey = `permissions:${userId}`;
  const cached = await redisManager.get(cacheKey);

  if (cached) {
    return cached;
  }

  const userWithRoles = await prisma.employee.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles || !userWithRoles.roles) {
    return [];
  }

  const permissions = userWithRoles.roles.reduce((acc: string[], employeeRole) => {
    if (employeeRole.role && employeeRole.role.permissions) {
      const rolePermissions = employeeRole.role.permissions
        .filter(rp => rp.permission && verifyPermissionHash(rp.permission.name, rp.permission.hash))
        .map(rp => rp.permission.name);
      return [...acc, ...rolePermissions];
    }
    return acc;
  }, []);

  // Remove duplicates
  const uniquePermissions = [...new Set(permissions)];

  await redisManager.set(cacheKey, uniquePermissions, CACHE_TTL);

  return uniquePermissions;
}

// I must call this when update user roles, update role permissions, delete role
export const invalidateUserPermissionCache = async (userId: string): Promise<void> => {
  const cacheKey = `permissions:${userId}`;
  await redisManager.delete(cacheKey);
};

export const hasPermission = (requiredPermission: Permission) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(401, 'Authentication required');
      }

      const userPermissions = await getUserPermissions(userId);
      if (!userPermissions.includes(requiredPermission)) {
        await auditLog('PERMISSION_DENIED', {
          userId,
          requiredPermission,
          path: req.path,
          method: req.method,
          ip: req.ip,
        });
        throw new AppError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
