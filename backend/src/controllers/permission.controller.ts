import { Response } from 'express';
import { PermissionService } from '../services/permission.service';
import { AuthenticatedRequest } from '../types/express';
import { CreatePermissionInput, AssignPermissionInput } from '../interfaces/permission.interface';
import { logger } from '../lib/logging/logger';
import { AppError } from '../middleware/error.handler';

export class PermissionController {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService();
  }

  createPermission = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Authentication required');
      }

      const { name, description } = req.body;
      if (!name) {
        throw new AppError(400, 'Permission name is required');
      }

      const data: CreatePermissionInput = {
        name,
        description,
        user: req.user.id,
      };

      const permission = await this.permissionService.createPermission(data);

      res.status(201).json({
        status: 'success',
        data: permission,
      });
    } catch (error) {
      logger.error('Error in createPermission controller:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Internal server error');
    }
  };

  getPermissions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const permissions = await this.permissionService.getPermissions();

      res.status(200).json({
        status: 'success',
        data: permissions,
      });
    } catch (error) {
      logger.error('Error in getPermissions controller:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Internal server error');
    }
  };

  getPermission = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const permission = await this.permissionService.getPermissionById(req.params.permissionId);
      res.status(200).json({
        status: 'success',
        data: permission,
      });
    } catch (error) {
      logger.error('Error in getPermission controller:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Internal server error');
    }
  };

  assignPermissionsToRole = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Authentication required');
      }

      const { permissions } = req.body;
      const { roleId } = req.params;

      if (!roleId) {
        throw new AppError(400, 'Role ID is required');
      }
      if (!Array.isArray(permissions) || permissions.length === 0) {
        throw new AppError(400, 'Valid permissions array is required');
      }

      const data: AssignPermissionInput = {
        roleId,
        permissions,
        user: req.user.id,
      };

      await this.permissionService.assignPermissionsToRole(data);

      res.status(200).json({
        status: 'success',
        message: 'Permissions assigned successfully',
      });
    } catch (error) {
      logger.error('Error in assignPermissionsToRole controller:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Internal server error');
    }
  };

  getRolePermissions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const permissions = await this.permissionService.getRolePermissions(req.params.roleId);

      res.status(200).json({
        status: 'success',
        data: permissions,
      });
    } catch (error) {
      logger.error('Error in getRolePermissions controller:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Internal server error');
    }
  };
}
