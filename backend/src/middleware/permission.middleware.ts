import { Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { AppError } from './error.handler';
import { Permission } from '../constants/permission';
import { AuthenticatedRequest } from '../types/express';
import { Employee, EmployeeRole, Role, RolePermission } from '@prisma/client';

// Define proper nested types based on Prisma schema
interface EmployeeWithRoles extends Employee {
  roles: (EmployeeRole & {
    role: Role & {
      rolePermissions: (RolePermission & {
        permission: {
          id: string;
          name: string;
          hash: string;
        };
      })[];
    };
  })[];
}

export const hasPermission = (requiredPermission: Permission) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError(401, 'Authentication required');
      }

      // Get user's roles and permissions
      const userWithRoles = await prisma.employee.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      }) as EmployeeWithRoles | null;

      if (!userWithRoles) {
        throw new AppError(404, 'User not found');
      }

      // Check if user has the required permission
      const hasRequiredPermission = userWithRoles.roles.some(employeeRole => 
        employeeRole.role.rolePermissions.some(rp => 
          rp?.permission?.name === requiredPermission
        )
      );

      if (!hasRequiredPermission) {
        throw new AppError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};