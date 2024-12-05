import { PrismaClient } from '@prisma/client';
import { logger } from '../../lib/logging/logger';

const prisma = new PrismaClient();

async function createCategoryWithSubcategories(
  category: any,
  parentId: string | null = null,
  order: number = 0
) {
  const created = await prisma.category.create({
    data: {
      name: category.name,
      description: category.description,
      displayOrder: order,
      parentId: parentId,
      isActive: true,
    },
  });

  if (category.subcategories) {
    for (let [index, sub] of category.subcategories.entries()) {
      await createCategoryWithSubcategories(sub, created.id, index + 1);
    }
  }

  return created;
}

export async function seedCategories() {
  logger.info('📑 Seeding categories...');

  try {
    // Your categories array stays the same...
    const categories = [
      {
        name: 'Food',
        description: 'All food items',
        subcategories: [
          {
            name: 'Sides',
            description: 'Start your meal off right with our homemade sides',
          },
          {
            name: 'Burgers',
            description: 'Lets get ready to rumble with our delicious burgers',
            subcategories: [
              {
                name: 'Beef Burgers',
                description: 'All beef burgers',
              },
              {
                name: 'Chicken Burgers',
                description: 'All chicken burgers',
              },
              {
                name: 'Veggie Burgers',
                description: 'All vegetarian burgers',
              },
            ],
          },
          {
            name: 'Desserts',
            description: 'Sweet treats to finish off your meal',
            subcategories: [
              {
                name: 'Cakes',
                description: 'All cakes',
              },
              {
                name: 'Pies',
                description: 'All pies',
              },
              {
                name: 'Ice Cream',
                description: 'All ice cream',
              },
            ],
          },
        ],
      },
      {
        name: 'Beverages',
        description: 'Bring on the drinks',
        subcategories: [
          {
            name: 'Alcoholic',
            description: 'Adult beverages',
            subcategories: [
              {
                name: 'Beer',
                description: 'Our belgian beers',
              },
              {
                name: 'Wine',
                description: 'Our finest wines',
              },
              {
                name: 'Cocktails',
                description: 'Our signature cocktails',
              },
            ],
          },
          {
            name: 'Non-Alcoholic',
            description: 'For the kids and the designated drivers',
            subcategories: [
              {
                name: 'Soda',
                description: 'All your favorite sodas',
              },
              {
                name: 'Juice',
                description: 'Fresh squeezed juices',
              },
              {
                name: 'Water',
                description: 'Bottled water',
              },
            ],
          },
        ],
      },
    ];

    for (let [index, category] of categories.entries()) {
      await createCategoryWithSubcategories(category, null, index + 1);
    }

    const count = await prisma.category.count();
    logger.info('📑 Categories seeded successfully');
  } catch (error) {
    logger.error('📑 Error seeding categories:', error);
    throw error;
  }
}
