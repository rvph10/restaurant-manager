import { PrismaClient, MenuType, Weekday } from '@prisma/client';
import { logger } from '../../lib/logging/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function getProductIdByName(name: string): Promise<string> {
  const product = await prisma.product.findFirst({
    where: { name },
  });
  if (!product) throw new Error(`Product ${name} not found`);
  return product.id;
}

export async function seedMenus() {
  try {
    logger.info('🍽️  Seeding menus...');

    // Create a Burger Combo Menu
    const burgerCombo = await prisma.menu.create({
      data: {
        name: "Burger Lover's Combo",
        description: 'Choose your favorite burger with sides and a drink',
        type: MenuType.COMBO,
        isActive: true,
        isAvailable: true,
        basePrice: new Decimal(12.99),
        daysOfWeek: [
          Weekday.MONDAY,
          Weekday.TUESDAY,
          Weekday.WEDNESDAY,
          Weekday.THURSDAY,
          Weekday.FRIDAY,
        ],
      },
    });

    // Create groups for the burger combo
    const burgerGroup = await prisma.menuGroup.create({
      data: {
        menuId: burgerCombo.id,
        name: 'Choose your burger',
        minSelect: 1,
        maxSelect: 1,
        sequence: 1,
        isRequired: true,
        description: 'Select one burger from our menu',
      },
    });

    // Add burger options to the group
    const burgers = ['Cheese & Bacon', 'Chicken Burger', 'Veggie Burger'];
    for (const burger of burgers) {
      const productId = await getProductIdByName(burger);
      await prisma.menuGroupProduct.create({
        data: {
          groupId: burgerGroup.id,
          productId,
          specialPrice: new Decimal(0), // Included in combo price
          // Override default options if needed
          overrideOptions: {
            restrictedChoices: ['Brioche Buns'], // Example: limit bun choices
          },
        },
      });
    }

    // Create sides group
    const sidesGroup = await prisma.menuGroup.create({
      data: {
        menuId: burgerCombo.id,
        name: 'Choose your side',
        minSelect: 1,
        maxSelect: 1,
        sequence: 2,
        isRequired: true,
      },
    });

    // Add sides options
    const sides = ['Fries', 'Nuggets'];
    for (const side of sides) {
      const productId = await getProductIdByName(side);
      await prisma.menuGroupProduct.create({
        data: {
          groupId: sidesGroup.id,
          productId,
          specialPrice: new Decimal(0),
          // Force small/regular portions for combo
          overrideOptions: {
            'Portions size': ['Small', 'Medium'],
          },
        },
      });
    }

    // Create drinks group
    const drinksGroup = await prisma.menuGroup.create({
      data: {
        menuId: burgerCombo.id,
        name: 'Choose your drink',
        minSelect: 1,
        maxSelect: 1,
        sequence: 3,
        isRequired: true,
      },
    });

    // Add drinks options
    const drinks = ['Coke', 'Fanta', 'Sprite'];
    for (const drink of drinks) {
      const productId = await getProductIdByName(drink);
      await prisma.menuGroupProduct.create({
        data: {
          groupId: drinksGroup.id,
          productId,
          specialPrice: new Decimal(0),
        },
      });
    }

    // Create Party Box Menu
    const partyBox = await prisma.menu.create({
      data: {
        name: 'Party Box',
        description: 'Perfect for sharing! Includes wings, nuggets, and fries',
        type: MenuType.COMBO,
        isActive: true,
        isAvailable: true,
        basePrice: new Decimal(24.99),
      },
    });

    // Add fixed items to party box
    const fixedItems = [
      { name: 'Nuggets', quantity: 2 }, // Two portions of nuggets
      { name: 'Fries', quantity: 2 }, // Two portions of fries
    ];

    for (const item of fixedItems) {
      const productId = await getProductIdByName(item.name);
      await prisma.menuFixedItem.create({
        data: {
          menuId: partyBox.id,
          productId,
          quantity: item.quantity,
          fixedOptions: {
            'Portions size': item.name === 'Nuggets' ? '12 pieces' : 'Large',
          },
        },
      });
    }

    // Create optional dessert group
    const dessertGroup = await prisma.menuGroup.create({
      data: {
        menuId: partyBox.id,
        name: 'Choose your dessert',
        minSelect: 1,
        maxSelect: 1,
        sequence: 1,
        isRequired: false,
        description: 'Add a dessert to your party box',
      },
    });

    // Add dessert options
    const desserts = ['Chocolate Cake', 'Apple Pie'];
    for (const dessert of desserts) {
      const productId = await getProductIdByName(dessert);
      await prisma.menuGroupProduct.create({
        data: {
          groupId: dessertGroup.id,
          productId,
          specialPrice: new Decimal(4.99), // Special add-on price
        },
      });
    }

    logger.info('🍽️  Menus seeded successfully');
  } catch (error) {
    logger.error('Error seeding menus:', error);
    throw error;
  }
}
