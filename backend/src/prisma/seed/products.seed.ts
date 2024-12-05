import {
  PrismaClient,
  IngredientCategory,
  MeasurementUnit,
  Product,
  ProductIngredient,
  Ingredient,
} from '@prisma/client';
import { logger } from '../../lib/logging/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface IngredientWithQuantity {
  name: string;
  quantity: number;
  unit: string;
}

interface ProductOption {
  name: string;
  required: boolean;
  choices: OptionChoice[];
}

interface OptionChoice {
  name: string;
  priceModifiers: PriceModifier[];
  ingredients?: IngredientWithQuantity[];
}

interface PriceModifier {
  type: 'MULTIPLIER' | 'FIXED' | 'ADDITIVE';
  value: number;
}

interface productData {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  image?: string;
  isAvailable: boolean;
  preparationTime: number;
  allergens: string[];
  freeExtras: number;
  freeExtrasCategory: IngredientCategory[] | null;
  ingredients: IngredientWithQuantity[];
  options?: ProductOption[];
}

async function getCategoryIdByName(name: string): Promise<string> {
  const category = await prisma.category.findFirst({
    where: { name },
  });
  if (!category) throw new Error(`Category ${name} not found`);
  return category.id;
}

async function getIngredientByName(name: string): Promise<Ingredient> {
  const ingredient = await prisma.ingredient.findFirst({
    where: { name },
  });
  if (!ingredient) throw new Error(`Ingredient ${name} not found`);
  return ingredient;
}

const products: productData[] = [
  {
    name: 'Cheese & Bacon',
    description: 'A delicious burger with cheese and crispy bacon',
    price: 6.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 12,
    allergens: ['Dairy', 'Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Beef Patty', quantity: 1, unit: MeasurementUnit.PIECE },
      { name: 'Bacon', quantity: 0.07, unit: MeasurementUnit.KILOGRAM },
      { name: 'Cheddar', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Eggs', quantity: 1, unit: MeasurementUnit.PIECE },
      { name: 'Onions', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
      { name: 'Tomato', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Salad', quantity: 0.015, unit: MeasurementUnit.KILOGRAM },
      { name: 'Pickles', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Ketchup', quantity: 0.03, unit: MeasurementUnit.LITER },
      { name: 'Mayonnaise', quantity: 0.03, unit: MeasurementUnit.LITER },
    ],
    options: [
      {
        name: 'Buns type',
        required: true,
        choices: [
          {
            name: 'Regular Buns',
            priceModifiers: [],
            ingredients: [{ name: 'Regular Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'Brioche Buns',
            priceModifiers: [{ type: 'ADDITIVE', value: 0.5 }],
            ingredients: [{ name: 'Brioche Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Burger Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Chicken Burger',
    description: 'A tasty chicken burger with fresh ingredients',
    price: 6.49,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 10,
    allergens: ['Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Chicken breast', quantity: 1, unit: MeasurementUnit.PIECE },
      { name: 'Cheddar', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Caramelized Onions', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
      { name: 'Tomato', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Salad', quantity: 0.015, unit: MeasurementUnit.KILOGRAM },
      { name: 'Pickles', quantity: 2, unit: MeasurementUnit.PIECE },
    ],
    options: [
      {
        name: 'Buns type',
        required: true,
        choices: [
          {
            name: 'Regular Buns',
            priceModifiers: [],
            ingredients: [{ name: 'Regular Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'Brioche Buns',
            priceModifiers: [{ type: 'ADDITIVE', value: 0.5 }],
            ingredients: [{ name: 'Brioche Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Burger Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Grizzly Burger',
    description: 'A hearty burger with double beef patties and cheese',
    price: 8.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: false,
    preparationTime: 15,
    allergens: ['Dairy', 'Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Beef Patty', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Bacon', quantity: 0.07, unit: MeasurementUnit.KILOGRAM },
      { name: 'Raclette Cheese', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Caramelized Onions', quantity: 0.05, unit: MeasurementUnit.KILOGRAM },
      { name: 'Tomato', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Salad', quantity: 0.015, unit: MeasurementUnit.KILOGRAM },
      { name: 'Pickles', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Honey Mustard', quantity: 0.03, unit: MeasurementUnit.LITER },
      { name: 'Garlic Aioli', quantity: 0.03, unit: MeasurementUnit.LITER },
    ],
    options: [
      {
        name: 'Buns type',
        required: true,
        choices: [
          {
            name: 'Regular Buns',
            priceModifiers: [],
            ingredients: [{ name: 'Regular Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'Brioche Buns',
            priceModifiers: [{ type: 'ADDITIVE', value: 0.5 }],
            ingredients: [{ name: 'Brioche Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Burger Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Pollo Hermanos',
    description: 'A flavorful chicken burger with a spicy kick',
    price: 7.49,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 12,
    allergens: ['Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Chicken breast', quantity: 1, unit: MeasurementUnit.PIECE },
      { name: 'Eggs', quantity: 1, unit: MeasurementUnit.PIECE },
      { name: 'Mozzarella', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Onions', quantity: 0.05, unit: MeasurementUnit.KILOGRAM },
      { name: 'Jalapeños', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
      { name: 'Tomato', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Salad', quantity: 0.015, unit: MeasurementUnit.KILOGRAM },
      { name: 'Pickles', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'BBQ Sauce', quantity: 0.03, unit: MeasurementUnit.LITER },
      { name: 'Garlic Aioli', quantity: 0.03, unit: MeasurementUnit.LITER },
    ],
    options: [
      {
        name: 'Buns type',
        required: true,
        choices: [
          {
            name: 'Regular Buns',
            priceModifiers: [],
            ingredients: [{ name: 'Regular Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'Brioche Buns',
            priceModifiers: [{ type: 'ADDITIVE', value: 0.5 }],
            ingredients: [{ name: 'Brioche Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Burger Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Pepper Burger',
    description: 'A spicy burger with pepper sauce and jalapeños',
    price: 7.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 12,
    allergens: ['Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Beef Patty', quantity: 1, unit: MeasurementUnit.PIECE },
      { name: 'Cheddar', quantity: 3, unit: MeasurementUnit.PIECE },
      { name: 'Caramelized Onions', quantity: 0.05, unit: MeasurementUnit.KILOGRAM },
      { name: 'Jalapeños', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
      { name: 'Tomato', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Salad', quantity: 0.015, unit: MeasurementUnit.KILOGRAM },
      { name: 'Pickles', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Pepper Sauce', quantity: 0.03, unit: MeasurementUnit.LITER },
      { name: 'Garlic Aioli', quantity: 0.03, unit: MeasurementUnit.LITER },
    ],
    options: [
      {
        name: 'Buns type',
        required: true,
        choices: [
          {
            name: 'Regular Buns',
            priceModifiers: [],
            ingredients: [{ name: 'Regular Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'Brioche Buns',
            priceModifiers: [{ type: 'ADDITIVE', value: 0.5 }],
            ingredients: [{ name: 'Brioche Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Burger Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Veggie Burger',
    description: 'A vegetarian burger with fresh ingredients',
    price: 5.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 10,
    allergens: ['Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Veggie patty', quantity: 1, unit: MeasurementUnit.PIECE },
      { name: 'Cheddar', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Caramelized Onions', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
      { name: 'Tomato', quantity: 2, unit: MeasurementUnit.PIECE },
      { name: 'Salad', quantity: 0.015, unit: MeasurementUnit.KILOGRAM },
      { name: 'Pickles', quantity: 2, unit: MeasurementUnit.PIECE },
    ],
    options: [
      {
        name: 'Buns type',
        required: true,
        choices: [
          {
            name: 'Regular Buns',
            priceModifiers: [],
            ingredients: [{ name: 'Regular Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'Brioche Buns',
            priceModifiers: [{ type: 'ADDITIVE', value: 0.5 }],
            ingredients: [{ name: 'Brioche Buns', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Burger Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Nuggets',
    description: 'crispy chicken nuggets',
    price: 4.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 8,
    allergens: ['Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [],
    options: [
      {
        name: 'Portions size',
        required: true,
        choices: [
          {
            name: '6 pieces',
            priceModifiers: [],
            ingredients: [{ name: 'Nuggets', quantity: 6, unit: MeasurementUnit.PIECE }],
          },
          {
            name: '9 pieces',
            priceModifiers: [{ type: 'ADDITIVE', value: 1.5 }],
            ingredients: [{ name: 'Nuggets', quantity: 9, unit: MeasurementUnit.PIECE }],
          },
          {
            name: '12 pieces',
            priceModifiers: [{ type: 'ADDITIVE', value: 2.3 }],
            ingredients: [{ name: 'Nuggets', quantity: 12, unit: MeasurementUnit.PIECE }],
          },
        ],
      },
      {
        name: 'Sauces',
        required: false,
        choices: [
          {
            name: 'Ketchup Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'Ketchup', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
          {
            name: 'BBQ Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'BBQ Sauce', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
          {
            name: 'Pepper Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'Pepper Sauce', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Nugget Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Fries',
    description: 'crispy fries',
    price: 2.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 5,
    allergens: ['Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [],
    options: [
      {
        name: 'Portions size',
        required: true,
        choices: [
          {
            name: 'Small',
            priceModifiers: [],
            ingredients: [{ name: 'Potato', quantity: 0.085, unit: MeasurementUnit.KILOGRAM }],
          },
          {
            name: 'Medium',
            priceModifiers: [{ type: 'ADDITIVE', value: 1 }],
            ingredients: [{ name: 'Potato', quantity: 0.105, unit: MeasurementUnit.KILOGRAM }],
          },
          {
            name: 'Large',
            priceModifiers: [{ type: 'ADDITIVE', value: 1.3 }],
            ingredients: [{ name: 'Potato', quantity: 0.125, unit: MeasurementUnit.KILOGRAM }],
          },
        ],
      },
      {
        name: 'Sauces',
        required: false,
        choices: [
          {
            name: 'Ketchup Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'Ketchup', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
          {
            name: 'BBQ Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'BBQ Sauce', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
          {
            name: 'Pepper Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'Pepper Sauce', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Fries Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Chicken Wings',
    description: 'crispy chicken wings',
    price: 5.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 5,
    allergens: ['Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [],
    options: [
      {
        name: 'Portions size',
        required: true,
        choices: [
          {
            name: '4',
            priceModifiers: [],
            ingredients: [{ name: 'Wings', quantity: 4, unit: MeasurementUnit.PIECE }],
          },
          {
            name: '6',
            priceModifiers: [{ type: 'ADDITIVE', value: 2 }],
            ingredients: [{ name: 'Wings', quantity: 6, unit: MeasurementUnit.PIECE }],
          },
        ],
      },
      {
        name: 'Sauces',
        required: false,
        choices: [
          {
            name: 'Ketchup Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'Ketchup', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
          {
            name: 'BBQ Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'BBQ Sauce', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
          {
            name: 'Pepper Sauce',
            priceModifiers: [],
            ingredients: [{ name: 'Pepper Sauce', quantity: 0.03, unit: MeasurementUnit.LITER }],
          },
        ],
      },
      {
        name: 'Need Box?',
        required: false,
        choices: [
          {
            name: 'Yes',
            priceModifiers: [],
            ingredients: [{ name: 'Nugget Takeout Box', quantity: 1, unit: MeasurementUnit.PIECE }],
          },
          {
            name: 'No',
            priceModifiers: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Chocolate Cake',
    description: 'Rich and moist chocolate cake',
    price: 6.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 15,
    allergens: ['Dairy', 'Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [{ name: 'Chocolate Cake', quantity: 1, unit: MeasurementUnit.PIECE }],
    options: [
      {
        name: 'Ice Cream',
        required: false,
        choices: [
          {
            name: 'Vanilla',
            priceModifiers: [],
            ingredients: [
              { name: 'Vanilla Ice Cream', quantity: 0.125, unit: MeasurementUnit.LITER },
            ],
          },
          {
            name: 'Chocolate',
            priceModifiers: [],
            ingredients: [
              { name: 'Chocolate Ice Cream', quantity: 0.125, unit: MeasurementUnit.LITER },
            ],
          },
          {
            name: 'Strawberry',
            priceModifiers: [],
            ingredients: [
              { name: 'Strawberry Ice Cream', quantity: 0.125, unit: MeasurementUnit.LITER },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Apple Pie',
    description: 'Warm apple pie with a flaky crust',
    price: 5.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 15,
    allergens: ['Dairy', 'Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [{ name: 'Apple Pie', quantity: 1, unit: MeasurementUnit.PIECE }],
    options: [
      {
        name: 'Ice Cream',
        required: false,
        choices: [
          {
            name: 'Vanilla',
            priceModifiers: [],
            ingredients: [
              { name: 'Vanilla Ice Cream', quantity: 0.125, unit: MeasurementUnit.LITER },
            ],
          },
          {
            name: 'Chocolate',
            priceModifiers: [],
            ingredients: [
              { name: 'Chocolate Ice Cream', quantity: 0.125, unit: MeasurementUnit.LITER },
            ],
          },
          {
            name: 'Strawberry',
            priceModifiers: [],
            ingredients: [
              { name: 'Strawberry Ice Cream', quantity: 0.125, unit: MeasurementUnit.LITER },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Tiramisu',
    description: 'A classic Italian dessert made with coffee and mascarpone',
    price: 7.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 15,
    allergens: ['Dairy', 'Gluten'],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [{ name: 'Tiramisu', quantity: 1, unit: MeasurementUnit.PIECE }],
  },
  {
    name: 'Fanta',
    price: 2.49,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 0,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [{ name: 'Fanta', quantity: 1, unit: MeasurementUnit.CAN }],
  },
  {
    name: 'Sprite',
    price: 2.49,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 0,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [{ name: 'Sprite', quantity: 1, unit: MeasurementUnit.CAN }],
  },
  {
    name: 'Coke',
    price: 2.49,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 0,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [{ name: 'Coke', quantity: 1, unit: MeasurementUnit.CAN }],
  },
  {
    name: 'Mojito',
    description: 'A refreshing cocktail with mint and lime',
    price: 12.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 5,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Rum', quantity: 0.05, unit: MeasurementUnit.LITER },
      { name: 'Lime', quantity: 0.5, unit: MeasurementUnit.PIECE },
      { name: 'Mint', quantity: 0.05, unit: MeasurementUnit.KILOGRAM },
      { name: 'Sugar', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
      { name: 'Soda Water', quantity: 0.2, unit: MeasurementUnit.LITER },
    ],
  },
  {
    name: 'Margarita',
    description: 'A classic tequila cocktail with lime and salt',
    price: 12.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 5,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Tequila', quantity: 0.05, unit: MeasurementUnit.LITER },
      { name: 'Lime', quantity: 0.5, unit: MeasurementUnit.PIECE },
      { name: 'Salt', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
    ],
  },
  {
    name: 'Pina Colada',
    description: 'A tropical cocktail with rum, coconut and pineapple',
    price: 12.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 5,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Rum', quantity: 0.05, unit: MeasurementUnit.LITER },
      { name: 'Coconut Cream', quantity: 0.2, unit: MeasurementUnit.LITER },
      { name: 'Pineapple Juice', quantity: 0.2, unit: MeasurementUnit.LITER },
    ],
  },
  {
    name: 'Mojito Mocktail',
    description: 'A refreshing non-alcoholic cocktail with mint and lime',
    price: 6.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 5,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Lime', quantity: 0.5, unit: MeasurementUnit.PIECE },
      { name: 'Mint', quantity: 0.05, unit: MeasurementUnit.KILOGRAM },
      { name: 'Sugar', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
      { name: 'Soda Water', quantity: 0.2, unit: MeasurementUnit.LITER },
      { name: 'Rum', quantity: 0.05, unit: MeasurementUnit.LITER },
    ],
  },
  {
    name: 'Virgin Mojito',
    description: 'A refreshing non-alcoholic cocktail with mint and lime',
    price: 6.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 5,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Lime', quantity: 0.5, unit: MeasurementUnit.PIECE },
      { name: 'Mint', quantity: 0.05, unit: MeasurementUnit.KILOGRAM },
      { name: 'Sugar', quantity: 0.03, unit: MeasurementUnit.KILOGRAM },
      { name: 'Soda Water', quantity: 0.2, unit: MeasurementUnit.LITER },
    ],
  },
  {
    name: 'Virgin Pina Colada',
    description: 'A tropical non-alcoholic cocktail with coconut and pineapple',
    price: 6.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 5,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [
      { name: 'Coconut Cream', quantity: 0.2, unit: MeasurementUnit.LITER },
      { name: 'Pineapple Juice', quantity: 0.2, unit: MeasurementUnit.LITER },
    ],
  },
  {
    name: 'Belgian Ale',
    description: 'A rich and malty Belgian ale',
    price: 5.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 0,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [{ name: 'Belgian Ale', quantity: 0.33, unit: MeasurementUnit.LITER }],
  },
  {
    name: 'IPA',
    description: 'A hoppy and bitter IPA',
    price: 5.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 0,
    allergens: [],
    freeExtras: 0,
    freeExtrasCategory: [],
    ingredients: [{ name: 'IPA', quantity: 0.33, unit: MeasurementUnit.LITER }],
  },
  {
    name: 'Chardonnay',
    description: 'A crisp and fruity Chardonnay',
    price: 12.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 0,
    allergens: [],
    freeExtras: 5,
    freeExtrasCategory: [],
    ingredients: [],
    options: [
      {
        name: 'Size',
        required: true,
        choices: [
          {
            name: 'Glass',
            priceModifiers: [],
          },
          {
            name: 'Bottle',
            priceModifiers: [{ type: 'FIXED', value: 36.99 }],
          },
        ],
      },
    ],
  },
  {
    name: 'Merlot',
    description: 'Smooth and rich Merlot',
    price: 12.99,
    categoryId: '',
    image: 'https://via.placeholder.com/150',
    isAvailable: true,
    preparationTime: 0,
    allergens: [],
    freeExtras: 5,
    freeExtrasCategory: [],
    ingredients: [],
    options: [
      {
        name: 'Size',
        required: true,
        choices: [
          {
            name: 'Glass',
            priceModifiers: [],
          },
          {
            name: 'Bottle',
            priceModifiers: [{ type: 'FIXED', value: 36.99 }],
          },
        ],
      },
    ],
  },
];

export async function seedProducts() {
  try {
    logger.info('🍔 Seeding products...');
    // Set Categories
    const beefCategoryId = await getCategoryIdByName('Beef Burgers');
    const chickenCategoryId = await getCategoryIdByName('Chicken Burgers');
    const veggieCategoryId = await getCategoryIdByName('Veggie Burgers');
    const cakeCategoryId = await getCategoryIdByName('Cakes');
    const piesCategoryId = await getCategoryIdByName('Pies');
    const iceCreamCategoryId = await getCategoryIdByName('Ice Cream');
    const beerCategoryId = await getCategoryIdByName('Beer');
    const wineCategoryId = await getCategoryIdByName('Wine');
    const cocktailsCategoryId = await getCategoryIdByName('Cocktails');
    const sodaCategoryId = await getCategoryIdByName('Soda');
    const juiceCategoryId = await getCategoryIdByName('Juice');
    const sidesCategoryId = await getCategoryIdByName('Sides');

    products[0].categoryId = beefCategoryId;
    products[1].categoryId = chickenCategoryId;
    products[2].categoryId = beefCategoryId;
    products[3].categoryId = chickenCategoryId;
    products[4].categoryId = beefCategoryId;
    products[5].categoryId = veggieCategoryId;
    products[6].categoryId = sidesCategoryId;
    products[7].categoryId = sidesCategoryId;
    products[8].categoryId = sidesCategoryId;
    products[9].categoryId = cakeCategoryId;
    products[10].categoryId = piesCategoryId;
    products[11].categoryId = cakeCategoryId;
    products[12].categoryId = sodaCategoryId;
    products[13].categoryId = sodaCategoryId;
    products[14].categoryId = sodaCategoryId;
    products[15].categoryId = cocktailsCategoryId;
    products[16].categoryId = cocktailsCategoryId;
    products[17].categoryId = cocktailsCategoryId;
    products[18].categoryId = juiceCategoryId;
    products[19].categoryId = juiceCategoryId;
    products[20].categoryId = juiceCategoryId;
    products[21].categoryId = beerCategoryId;
    products[22].categoryId = beerCategoryId;
    products[23].categoryId = wineCategoryId;
    products[24].categoryId = wineCategoryId;

    for (const product of products) {
      // Create the product first
      const createdProduct = await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: new Decimal(product.price),
          categoryId: product.categoryId,
          image: product.image,
          isAvailable: product.isAvailable,
          preparationTime: product.preparationTime,
          allergens: product.allergens,
          freeExtras: product.freeExtras,
          freeExtraItems: product.freeExtrasCategory || [],
        },
      });

      // Then create the ProductIngredient relations
      for (const ingredient of product.ingredients) {
        const ingredientId = await getIngredientByName(ingredient.name);
        if (ingredient.unit !== ingredientId.unit) {
          logger.error(`Unit mismatch for ingredient ${ingredient.name}`);
          throw new Error(`Unit mismatch for ingredient ${ingredient.name}`);
        }
        await prisma.productIngredient.create({
          data: {
            productId: createdProduct.id,
            ingredientId: ingredientId.id,
            quantity: new Decimal(ingredient.quantity),
            unit: ingredient.unit as MeasurementUnit,
          },
        });
      }
      if (product.options) {
        for (const option of product.options) {
          const productOption = await prisma.productOption.create({
            data: {
              productId: createdProduct.id,
              name: option.name,
              required: option.required,
            },
          });

          for (const choice of option.choices) {
            await prisma.optionChoice.create({
              data: {
                productOptionId: productOption.id,
                name: choice.name,
                priceModifier:
                  choice.priceModifiers.length > 0
                    ? choice.priceModifiers.map((modifier) => ({
                        type: modifier.type,
                        value: new Decimal(modifier.value),
                      }))
                    : [],
              },
            });

            // Create ingredients for this choice if any
            if (choice.ingredients) {
              for (const ingredient of choice.ingredients) {
                const ingredientId = await getIngredientByName(ingredient.name);
                await prisma.productIngredient.create({
                  data: {
                    productId: createdProduct.id,
                    ingredientId: ingredientId.id,
                    quantity: new Decimal(ingredient.quantity),
                    unit: ingredient.unit as MeasurementUnit,
                  },
                });
              }
            }
          }
        }
      }
    }

    logger.info('🍔 Products seeded successfully');
  } catch (error) {
    logger.error('Error seeding products:', error);
    throw error;
  }
}
