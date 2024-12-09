import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logging/logger';
import { seedPermissions } from './seed/permissions.seed';
import { seedRoles } from './seed/roles.seed';
import { seedCategories } from './seed/categories.seed';
import { seedSuppliers } from './seed/suppliers.seed';
import { seedIngredients } from './seed/ingredients.seed';
import { seedProducts } from './seed/products.seed';
import { seedTables } from './seed/tables.seed';
import { seedCustomers } from './seed/customers.seed';
import { seedMenus } from './seed/menus.seed';
import { seedEmployees } from './seed/employees.seed';
import { seedStations } from './seed/stations.seed';

const prisma = new PrismaClient();

async function clearDatabase() {
  const tablesToClear = [
    'restaurants',
    'tax_configurations',
    'delivery_zones',
    'customers',
    'carts',
    'cart_items',
    'customer_addresses',
    'employees',
    'employee_documents',
    'certifications',
    'roles',
    'permissions',
    'role_permissions',
    'employee_roles',
    'performance_reviews',
    'timeoffs',
    'breaks',
    'shifts',
    'shift_sections',
    'shift_tasks',
    'shift_assignments',
    'scheduled_breaks',
    'audit_logs',
    'actual_breaks',
    'menus',
    'menu_groups',
    'menu_group_products',
    'menu_fixed_items',
    'menu_items',
    'categories',
    'product_options',
    'option_choices',
    'products',
    'product_ingredients',
    'ingredients',
    'ingredient_stock_logs',
    'suppliers',
    'orders',
    'order_items',
    'tables',
    'reservations',
    'notification_templates',
    'notifications',
    'announcements',
    'announcement_acknowledgments',
    'sales_metrics',
    'staff_metrics',
    'customer_metrics',
    'inventory_metrics',
    'report_schedules',
    'campaigns',
    'promotions',
    'discount_codes',
    'happy_hours',
    'promotion_usage',
    'stations',
    'workflow_steps',
    'queue_items',
  ];

  for (const table of tablesToClear) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      logger.info(`Cleared table: ${table}`);
    } catch (error: any) {
      if (error.code === 'P2010' && error.meta?.code === '42P01') {
        logger.warn(`Table ${table} does not exist, skipping...`);
      } else {
        logger.error(`Error clearing table ${table}:`, error);
        throw error;
      }
    }
  }
}

async function main() {
  logger.info('Starting database seed...');
  try {
    await clearDatabase();
    await seedPermissions();
    await seedRoles();
    await seedCategories();
    await seedSuppliers();
    await seedIngredients();
    await seedProducts();
    await seedTables();
    await seedCustomers();
    await seedMenus();
    await seedEmployees();
    await seedStations();
    logger.info('Database seed completed successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  logger.error('Fatal error during seeding:', error);
  process.exit(1);
});
