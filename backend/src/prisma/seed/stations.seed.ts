import { PrismaClient, StationType } from '@prisma/client';
import { logger } from '../../lib/logging/logger';

const prisma = new PrismaClient();

export async function seedStations() {
  try {
    logger.info('🚩 Seeding stations...');

    const stations = [
      {
        icon: '🍳',
        name: 'Plancha',
        type: StationType.GRILL,
        stepOrder: 1,
        displayLimit: 8,
        seenCategory: ['Burgers'],
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
        seenCategory: ['Sides'],
        maxCapacity: 10,
        isActive: true,
        isIndependent: false,
        isParallel: true,
        currentLoad: 0,
      },
      {
        icon: '🍔',
        name: 'Burger Assembly',
        type: StationType.ASSEMBLY,
        stepOrder: 2,
        displayLimit: 6,
        seenCategory: ['Burgers'],
        maxCapacity: 8,
        isActive: true,
        isIndependent: false,
        isParallel: true,
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
        displayLimit: 8,
        seenCategory: ['Beverages'],
        maxCapacity: 12,
        isActive: true,
        isIndependent: true, // Independent station
        currentLoad: 0,
      },
    ];

    for (const station of stations) {
      const categoryIds = await Promise.all(
        station.seenCategory.map(async (category) => {
          const foundCategory = await prisma.category.findUnique({ where: { name: category } });
          return foundCategory ? foundCategory.id : null;
        })
      );

      await prisma.station.create({
        data: {
          ...station,
          seenCategory: categoryIds.filter((id) => id !== null), // Filter out null values
        },
      });
    }

    const count = await prisma.station.count();
    logger.info('🚩 Stations seeded successfully');
  } catch (error) {
    logger.error('Error seeding stations:', error);
    throw error;
  }
}
