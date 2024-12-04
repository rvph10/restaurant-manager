export const PERMISSIONS = {
    // User Management
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    
    // Role Management
    ROLE_CREATE: 'role:create',
    ROLE_READ: 'role:read',
    ROLE_UPDATE: 'role:update',
    ROLE_DELETE: 'role:delete',
    
    // Product Management
    PRODUCT_CREATE: 'product:create',
    PRODUCT_READ: 'product:read',
    PRODUCT_UPDATE: 'product:update',
    PRODUCT_DELETE: 'product:delete',
    
    // Order Management
    ORDER_CREATE: 'order:create',
    ORDER_READ: 'order:read',
    ORDER_UPDATE: 'order:update',
    ORDER_DELETE: 'order:delete',
  } as const;
  
  export type Permission = keyof typeof PERMISSIONS;