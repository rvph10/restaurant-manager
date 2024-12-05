import { PrismaClient, TableStatus } from '@prisma/client';
import { logger } from '../../lib/logging/logger';

const prisma = new PrismaClient();

export async function seedTables() {
    logger.info('🪑 Seeding tables...');
  try {
    // Create 20 tables with different capacities
    const tableConfigurations = [
      { count: 8, capacity: 2 },  // 8 two-seater tables
      { count: 6, capacity: 4 },  // 6 four-seater tables
      { count: 4, capacity: 6 },  // 4 six-seater tables
      { count: 2, capacity: 8 }   // 2 eight-seater tables
    ];

    let tableNumber = 1;

    for (const config of tableConfigurations) {
      for (let i = 0; i < config.count; i++) {
        await prisma.table.create({
          data: {
            number: tableNumber++,
            capacity: config.capacity,
            status: TableStatus.AVAILABLE
          }
        });
      }
    }

    logger.info('🪑 Tables seeded successfully');
  } catch (error) {
    logger.error('Error seeding tables:', error);
    throw error;
  }
}