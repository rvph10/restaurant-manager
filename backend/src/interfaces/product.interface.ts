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

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductFilterOptions extends FilterOptions {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
}

export interface IngredientFilterOptions extends FilterOptions {
  category?: IngredientCategory;
  supplierId?: string;
  isExtra?: boolean;
  minStock?: number;
}

export interface CategoryFilterOptions extends FilterOptions {
  parentId?: string;
}

export interface SupplierFilterOptions extends FilterOptions {
  hasIngredients?: boolean;
}

export interface FilterOptions {
  search?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
