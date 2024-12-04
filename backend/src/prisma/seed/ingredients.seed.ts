import { PrismaClient, IngredientCategory, MeasurementUnit } from '@prisma/client';
import { logger } from '../../lib/logging/logger';

const prisma = new PrismaClient();
interface IngredientData {
    name: string;
    description?: string;
    stock: number;
    unit: MeasurementUnit;
    category: IngredientCategory;
    reorderPoint: number;
    reorderAmount: number;
    cost: number;
    isExtra: boolean;
    extraPrice?: number;
    supplierId?: string;
}

const ingredients: IngredientData[] = [
    // Proteins
    {
     name: 'Beef Patty',
     description: '100% beef patty',
        stock: 100,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.MEAT,
        reorderPoint: 35,
        reorderAmount: 65,
        cost: 1.60,
        isExtra: true,
        extraPrice: 2.20
    },
    {
        name : 'Bacon',
        description: 'Bacon Slices',
        stock: 3,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.MEAT,
        reorderPoint: 0.8,
        reorderAmount: 2.5,
        cost: 0.8,
        isExtra: true,
        extraPrice: 1.8
    },
    {
        name: 'Eggs',
        description: 'Morning poached eggs',
        stock: 80,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.DAIRY,
        reorderPoint: 20,
        reorderAmount: 48,
        cost: 0.2,
        isExtra: true,
        extraPrice: 1.5
    },
    {
        name: 'Chicken breast',
        description: 'Generous Chicken Breast',
        stock: 80,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.MEAT,
        reorderPoint: 30,
        reorderAmount: 65,
        cost: 1.1,
        isExtra: true,
        extraPrice: 2.2
    },
    {
        name: 'Veggie patty',
        description: 'A delicious plant-based patty',
        stock: 100,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 30,
        reorderAmount: 70,
        cost: 1.0,
        isExtra: true,
        extraPrice: 1.5
    },
    // Cheese
    {
        name: 'Raclette Cheese',
        description: 'French Cheese',
        stock: 150,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.DAIRY,
        reorderPoint: 60,
        reorderAmount: 90,
        cost: 1.5,
        isExtra: true,
        extraPrice: 2.2
    },
    {
        name: 'Mozzarella',
        description: 'Premium mozzarella slices',
        stock: 150,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.DAIRY,
        reorderPoint: 60,
        reorderAmount: 90,
        cost: 1.1,
        isExtra: true,
        extraPrice: 1.8
    },
    {
        name: 'Cheddar',
        description: 'A sharp, firm cheese',
        stock: 150,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.DAIRY,
        reorderPoint: 60,
        reorderAmount: 90,
        cost: 1.2,
        isExtra: true,
        extraPrice: 1.9
    },
    {
        name: 'Brie',
        description: 'A soft, creamy cheese',
        stock: 100,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.DAIRY,
        reorderPoint: 40,
        reorderAmount: 60,
        cost: 1.4,
        isExtra: true,
        extraPrice: 2.0
    },
    // Vegetables
    {
        name: 'Onions',
        description: 'Fresh onions',
        stock: 14,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 3,
        reorderAmount: 12,
        cost: 1.7,
        isExtra: false
    },
    {
        name: 'Caramelized Onions',
        description: 'Sweet caramelized onions',
        stock: 5,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 2,
        reorderAmount: 4,
        cost: 2.00,
        isExtra: true,
        extraPrice: 1.50
    },
    {
        name: 'Jalapeños',
        description: 'Sliced jalapeño peppers',
        stock: 5,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 1,
        reorderAmount: 4,
        cost: 1.20,
        isExtra: true,
        extraPrice: 1.00
    },
    {
        name: 'Tomato',
        description: 'Fresh tomatoes',
        stock: 60,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 45,
        reorderAmount: 135,
        cost: 0.4,
        isExtra: false
    },
    {
        name: 'Salad',
        description: 'Fresh salad greens',
        stock: 20,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 7,
        reorderAmount: 15,
        cost: 1.2,
        isExtra: false
    },
    {
        name: 'Pickles',
        description: 'Sliced pickles',
        stock: 160,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.CONDIMENTS,
        reorderPoint: 25,
        reorderAmount: 75,
        cost: 0.7,
        isExtra: true,
        extraPrice: 1.0
    },
    // Bakery
    {
        name: 'Regular Buns',
        description: 'Standard burger buns',
        stock: 200,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.BAKERY,
        reorderPoint: 50,
        reorderAmount: 150,
        cost: 0.3,
        isExtra: false
    },
    {
        name: 'Brioche Buns',
        description: 'Soft and buttery brioche buns',
        stock: 150,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.BAKERY,
        reorderPoint: 40,
        reorderAmount: 120,
        cost: 0.5,
        isExtra: true,
        extraPrice: 0.8
    },
    // Sauces
    {
        name: 'Mayonnaise',
        description: 'Creamy mayonnaise',
        stock: 50,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.CONDIMENTS,
        reorderPoint: 15,
        reorderAmount: 35,
        cost: 0.8,
        isExtra: true,
        extraPrice: 1.0
    },
    {
        name: 'Ketchup',
        description: 'Classic tomato ketchup',
        stock: 60,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.CONDIMENTS,
        reorderPoint: 20,
        reorderAmount: 40,
        cost: 0.5,
        isExtra: true,
        extraPrice: 0.7
    },
    {
        name: 'Honey Mustard',
        description: 'Sweet and tangy honey mustard',
        stock: 40,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.CONDIMENTS,
        reorderPoint: 10,
        reorderAmount: 30,
        cost: 0.9,
        isExtra: true,
        extraPrice: 1.2
    },
    {
        name: 'Pickle Sauce',
        description: 'Tangy pickle sauce',
        stock: 30,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.CONDIMENTS,
        reorderPoint: 10,
        reorderAmount: 20,
        cost: 0.7,
        isExtra: true,
        extraPrice: 1.0
    },

    {
        name: 'Pepper Sauce',
        description: 'Spicy pepper sauce',
        stock: 25,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.CONDIMENTS,
        reorderPoint: 8,
        reorderAmount: 20,
        cost: 0.6,
        isExtra: true,
        extraPrice: 0.9
    },
    {
        name: 'BBQ Sauce',
        description: 'Smoky barbecue sauce',
        stock: 40,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.CONDIMENTS,
        reorderPoint: 10,
        reorderAmount: 30,
        cost: 0.80,
        isExtra: true,
        extraPrice: 1.00
    },
    {
        name: 'Garlic Aioli',
        description: 'Homemade garlic aioli',
        stock: 30,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.CONDIMENTS,
        reorderPoint: 8,
        reorderAmount: 25,
        cost: 1.20,
        isExtra: true,
        extraPrice: 1.50
    },
    // Sides
    {
        name: 'Potato',
        description: 'Fresh potatoes',
        stock: 100,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 30,
        reorderAmount: 70,
        cost: 0.4,
        isExtra: false
    },
    {
        name: 'Nuggets',
        description: 'Frozen chicken nuggets',
        stock: 200,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.FROZEN,
        reorderPoint: 50,
        reorderAmount: 150,
        cost: 0.5,
        isExtra: true,
        extraPrice: 1.0
    },
    {
        name: 'Wings',
        description: 'Frozen chicken wings',
        stock: 150,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.FROZEN,
        reorderPoint: 40,
        reorderAmount: 120,
        cost: 0.6,
        isExtra: true,
        extraPrice: 1.2
    },
    // Desserts
    {
        name: 'Chocolate Cake',
        description: 'Rich and moist chocolate cake',
        stock: 50,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.SWEETS,
        reorderPoint: 15,
        reorderAmount: 35,
        cost: 2.0,
        isExtra: true,
        extraPrice: 3.5
    },
    {
        name: 'Vanilla Ice Cream',
        description: 'Creamy vanilla ice cream',
        stock: 30,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.FROZEN,
        reorderPoint: 10,
        reorderAmount: 20,
        cost: 1.5,
        isExtra: true,
        extraPrice: 2.5
    },
    {
        name: 'Chocolate Ice Cream',
        description: 'Rich chocolate ice cream',
        stock: 30,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.FROZEN,
        reorderPoint: 10,
        reorderAmount: 20,
        cost: 1.5,
        isExtra: true,
        extraPrice: 2.5
    },
    {
        name: 'Strawberry Ice Cream',
        description: 'Fresh strawberry ice cream',
        stock: 30,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.FROZEN,
        reorderPoint: 10,
        reorderAmount: 20,
        cost: 1.5,
        isExtra: true,
        extraPrice: 2.5
    },
    {
        name: 'Apple Pie',
        description: 'Classic apple pie',
        stock: 40,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.SWEETS,
        reorderPoint: 10,
        reorderAmount: 30,
        cost: 2.0,
        isExtra: true,
        extraPrice: 3.0
    },
    {
        name: 'Tiramisu',
        description: 'Traditional Italian tiramisu',
        stock: 40,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.SWEETS,
        reorderPoint: 10,
        reorderAmount: 30,
        cost: 2.5,
        isExtra: true,
        extraPrice: 3.5
    },
    // Beverages
    {
        name: 'Coke',
        description: 'Coca-Cola in a can',
        stock: 100,
        unit: MeasurementUnit.CAN,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 30,
        reorderAmount: 70,
        cost: 0.5,
        isExtra: false
    },
    {
        name: 'Fanta',
        description: 'Fanta in a can',
        stock: 100,
        unit: MeasurementUnit.CAN,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 30,
        reorderAmount: 70,
        cost: 0.5,
        isExtra: false
    },
    {
        name: 'Sprite',
        description: 'Sprite in a can',
        stock: 100,
        unit: MeasurementUnit.CAN,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 30,
        reorderAmount: 70,
        cost: 0.5,
        isExtra: false
    },
    // Cocktails
    {
        name: 'Rum',
        description: 'Rum for Mojito',
        stock: 20,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 5,
        reorderAmount: 15,
        cost: 1.0,
        isExtra: false
    },
    {
        name: 'Mint',
        description: 'Fresh mint leaves',
        stock: 10,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 3,
        reorderAmount: 7,
        cost: 0.5,
        isExtra: false
    },
    {
        name: 'Lime',
        description: 'Fresh limes',
        stock: 30,
        unit: MeasurementUnit.PIECE,
        category: IngredientCategory.PRODUCE,
        reorderPoint: 10,
        reorderAmount: 20,
        cost: 0.3,
        isExtra: false
    },
    {
        name: 'Sugar',
        description: 'Granulated sugar',
        stock: 50,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.PANTRY,
        reorderPoint: 15,
        reorderAmount: 35,
        cost: 0.2,
        isExtra: false
    },
    {
        name: 'Soda Water',
        description: 'Carbonated soda water',
        stock: 50,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 15,
        reorderAmount: 35,
        cost: 0.5,
        isExtra: false
    },
    {
        name: 'Tequila',
        description: 'Tequila for Margarita',
        stock: 20,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 5,
        reorderAmount: 15,
        cost: 1.5,
        isExtra: false
    },
    {
        name: 'Lime Juice',
        description: 'Fresh lime juice',
        stock: 30,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 10,
        reorderAmount: 20,
        cost: 0.8,
        isExtra: false
    },
    {
        name: 'Triple Sec',
        description: 'Orange-flavored liqueur',
        stock: 20,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 5,
        reorderAmount: 15,
        cost: 1.2,
        isExtra: false
    },
    {
        name: 'Salt',
        description: 'Salt for Margarita rim',
        stock: 50,
        unit: MeasurementUnit.KILOGRAM,
        category: IngredientCategory.PANTRY,
        reorderPoint: 15,
        reorderAmount: 35,
        cost: 0.1,
        isExtra: false
    },
    {
        name: 'Coconut Cream',
        description: 'Creamy coconut cream',
        stock: 20,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 5,
        reorderAmount: 15,
        cost: 1.0,
        isExtra: false
    },
    {
        name: 'Pineapple Juice',
        description: 'Fresh pineapple juice',
        stock: 30,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 10,
        reorderAmount: 20,
        cost: 0.8,
        isExtra: false
    },
    // Beers
    {
        name: 'Belgian Ale',
        description: 'Smooth Belgian ale',
        stock: 100,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 30,
        reorderAmount: 70,
        cost: 1.5,
        isExtra: true,
        extraPrice: 2.5
    },
    {
        name: 'IPA',
        description: 'Hoppy India Pale Ale',
        stock: 100,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 30,
        reorderAmount: 70,
        cost: 1.5,
        isExtra: true,
        extraPrice: 2.5
    },
    // Wines
    {
        name: 'Chardonnay',
        description: 'Crisp and fruity Chardonnay',
        stock: 50,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 15,
        reorderAmount: 35,
        cost: 3.0,
        isExtra: true,
        extraPrice: 5.0
    },
    {
        name: 'Merlot',
        description: 'Smooth and rich Merlot',
        stock: 50,
        unit: MeasurementUnit.LITER,
        category: IngredientCategory.BEVERAGE,
        reorderPoint: 15,
        reorderAmount: 35,
        cost: 3.0,
        isExtra: true,
        extraPrice: 5.0
    }
];

export async function seedIngredients() {
  logger.info('🥕 Seeding ingredients...');

  try {
    for (const ingredient of ingredients) {
      await prisma.ingredient.create({
        data: ingredient
      });
    }

    const count = await prisma.ingredient.count();
    logger.info(`🥕 Ingredients seeded successfully`);
  } catch (error) {
    logger.error('🥕 Error seeding ingredients:', error);
    throw error;
  }
}