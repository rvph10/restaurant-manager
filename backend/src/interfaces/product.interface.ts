import { MeasurementUnit, IngredientCategory } from "@prisma/client";

export interface CreateIngredientInput {
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
    supplierId: string; 
    price: number;
    }