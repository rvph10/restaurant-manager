import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/permission.middleware';
import { PERMISSIONS } from '../constants/permission';

const router = Router();
const permissionController = new PermissionController();

router.post(
  '/',
  authenticate,
  hasPermission(PERMISSIONS.PERMISSION_CREATE),
  permissionController.createPermission
);

router.get(
  '/',
  authenticate,
  hasPermission(PERMISSIONS.PERMISSION_READ),
  permissionController.getPermissions
);

router.get(
  '/:permissionId',
  authenticate,
  hasPermission(PERMISSIONS.PERMISSION_READ),
  permissionController.getPermission
);

router.post(
  '/roles/:roleId/permissions',
  authenticate,
  hasPermission(PERMISSIONS.PERMISSION_UPDATE),
  permissionController.assignPermissionsToRole
);

router.get(
  '/roles/:roleId/permissions',
  authenticate,
  hasPermission(PERMISSIONS.PERMISSION_READ),
  permissionController.getRolePermissions
);

export { router as permissionRoutes };