import { PrismaClient, StationType } from '@prisma/client';
import { logger } from '../../lib/logging/logger';
import { ProductService } from '../../services/product.service';

const prisma = new PrismaClient();

export async function seedStations() {
  try {
    logger.info('Starting station seeding...');

    const stations = [
      {
        icon: '🍳',
        name: 'Plancha',
        type: StationType.GRILL,
        stepOrder: 1,
        displayLimit: 8,
        seenCategory: ['Burgers'], // Can see all burger categories
        maxCapacity: 12,
        isActive: true,
        isIndependent: false,
        currentLoad: 0,
      },
      {
        icon: '🍟',
        name: 'Fryer',
        type: StationType.FRY,
        stepOrder: 2,
        displayLimit: 6,
        seenCategory: ['Sides'], // Handles sides
        maxCapacity: 10,
        isActive: true,
        isIndependent: false, // Part of parallel step
        currentLoad: 0,
      },
      {
        icon: '🍔',
        name: 'Burger Assembly',
        type: StationType.ASSEMBLY,
        stepOrder: 2, // Same step order as fryer for parallel processing
        displayLimit: 6,
        seenCategory: ['Burgers'],
        maxCapacity: 8,
        isActive: true,
        isIndependent: false, // Part of parallel step
        currentLoad: 0,
      },
      {
        icon: '📦',
        name: 'Order Assembly',
        type: StationType.ASSEMBLY,
        stepOrder: 3,
        displayLimit: 10,
        seenCategory: ['Burgers', 'Sides', 'Beverages', 'Food'], // Can see all categories
        maxCapacity: 15,
        isActive: true,
        isIndependent: false,
        currentLoad: 0,
      },
      {
        icon: '🍺',
        name: 'Bar',
        type: StationType.BAR,
        stepOrder: 1, // Can start independently
        displayLimit: 8,
        seenCategory: ['Beverages',],
        maxCapacity: 12,
        isActive: true,
        isIndependent: true, // Independent station
        currentLoad: 0,
      }
    ];
    

    for (const station of stations) {
      const categoryIds = await Promise.all(station.seenCategory.map(async (category) => {
      const foundCategory = await prisma.category.findUnique({ where: { name: category } });
      return foundCategory ? foundCategory.id : null;
      }));

      await prisma.station.create({
      data: {
        ...station,
        seenCategory: categoryIds.filter(id => id !== null), // Filter out null values
      },
      });
    }

    const count = await prisma.station.count();
    logger.info(`Station seeding completed successfully. Created ${count} stations.`);
  } catch (error) {
    logger.error('Error seeding stations:', error);
    throw error;
  }
}