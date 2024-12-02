import { MeasurementUnit, IngredientCategory, Category } from '@prisma/client';

export interface CreateIngredientInput {
  user: string;
  name: string;
  description?: string;
  stock: number;
  unit: MeasurementUnit;
  category: IngredientCategory;
  reorderPoint: number;
  reorderAmount: number;
  cost: number;
  isExtra: boolean | false;
  extraPrice?: number;
  supplierId?: string;
  price: number;
}

export interface CreateCategoryInput {
  user: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean | true;
  parentId?: string;
}

export interface CreateProductInput {
  user: string;
  name: string;
  description?: string;
  price: number;
  unit: MeasurementUnit;
  categoryId: string;
  image?: string;
  isAvailable: boolean | true;
  preparationTime: number;
  allergens: string[] | [];
  freeExtras: number;
  freeExtrasCategory: IngredientCategory | null;
  ingredients: string[];
}

export interface CreateSupplierInput {
  user: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
}
