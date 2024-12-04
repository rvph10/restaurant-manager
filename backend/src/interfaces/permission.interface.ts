export interface CreatePermissionInput {
  user: string;
  name: string;
  description?: string;
}

export interface AssignPermissionInput {
  user: string;
  roleId: string;
  permissions: string[];
}

export interface PermissionResponse {
  id: string;
  name: string;
  description?: string;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}
