import { MenuType, Weekday } from '@prisma/client';

export interface MenuDataInput {
  name: string;
  description?: string;
  type: MenuType;
  isActive: boolean;
  isAvailable: boolean;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: Weekday[];
  basePrice?: number; // Added to match database
  items?: MenuItemInput[]; // Made optional
  groups?: MenuGroupInput[]; // Made optional
  fixedItems?: MenuFixedItemInput[]; // Made optional
  user?: string; // Added for audit logging
}

export interface MenuGroupInput {
  name: string;
  minSelect: number;
  maxSelect: number;
  sequence: number;
  products: string;
  isRequired: boolean;
  description?: string;
  overrideOptions?: Record<string, any>; // Added
  productMaxQuantity?: number; // Added
  productSpecialPrice?: number; // Added
}

export interface MenuItemInput {
  productId: string;
  itemType: string;
  isRequired: boolean;
  maxQuantity: number;
  sequence: number;
  specialPrice: number;
}

export interface MenuFixedItemInput {
  productId: string;
  quantity: number;
  sequence: number;
  description?: string;
  fixedOptions?: Record<string, any>; // Changed from JsonArray
}
