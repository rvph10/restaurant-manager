import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logging/logger';

// Import individual seeders
// import { seedProducts } from './seeds/products.seed';

const prisma = new PrismaClient();

async function clearDatabase() {
  const tablesToClear = [
    'restaurant',
    'tax_configuration',
    'delivery_zone',
    'customer',
    'cart',
    'cart_item',
    'customer_address',
    'employee',
    'employee_document',
    'certification',
    'role',
    'permission',
    'role_permission',
    'employee_role',
    'performance_review',
    'time_off',
    'break',
    'shift',
    'shift_section',
    'shift_task',
    'shift_assignement',
    'scheduled_break',
    'audit_log',
    'actual_break',
    'menu',
    'menu_item',
    'category',
    'product',
    'product_ingredient',
    'ingredient',
    'ingredient_stock_log',
    'supplier',
    'order',
    'order_item',
    'table',
    'reservation',
    'notification_template',
    'notification',
    'announcement',
    'announcement_acknowledgement',
    'sales_metric',
    'staff_metric',
    'customer_metric',
    'inventory_metric',
    'report_schedule',
    'campaign',
    'promotion',
    'discount_code',
    'happy_hour',
    'promotion_usage',
    'kitchen_station',
    'kitchen_staff_assignement',
    'kitchen_queue',
    'kitchen_order_item',
    'production_line',
    'production_production_step',
    'station_step',
    'order_progress',
    'step_progress',
  ];

  for (const table of tablesToClear) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      logger.info(`Cleared table: ${table}`);
    } catch (error) {
      logger.error(`Error clearing table ${table}:`, error);
      throw error;
    }
  }
}

async function main() {
  logger.info('Starting database seed...');

  try {
    // Clear all tables first
    await clearDatabase();
    logger.info('Database cleared successfully');

    // Seed in specific order due to dependencies
    // await seedProducts();

    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    logger.error('Fatal error during seeding:', error);
    process.exit(1);
  });