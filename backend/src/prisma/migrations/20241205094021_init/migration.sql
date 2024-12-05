-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IngredientCategory" ADD VALUE 'PACKAGING';
ALTER TYPE "IngredientCategory" ADD VALUE 'CLEANING';
ALTER TYPE "IngredientCategory" ADD VALUE 'DISPOSABLES';
ALTER TYPE "IngredientCategory" ADD VALUE 'EQUIPMENT';
ALTER TYPE "IngredientCategory" ADD VALUE 'PAPER_GOODS';
ALTER TYPE "IngredientCategory" ADD VALUE 'TOILETRIES';
ALTER TYPE "IngredientCategory" ADD VALUE 'OTHER_SUPPLIES';
ALTER TYPE "IngredientCategory" ADD VALUE 'UNIFORMS';
ALTER TYPE "IngredientCategory" ADD VALUE 'MARKETING_MATERIALS';
ALTER TYPE "IngredientCategory" ADD VALUE 'OFFICE_SUPPLIES';
ALTER TYPE "IngredientCategory" ADD VALUE 'TECHNOLOGY';
ALTER TYPE "IngredientCategory" ADD VALUE 'FURNITURE';
ALTER TYPE "IngredientCategory" ADD VALUE 'DECOR';
ALTER TYPE "IngredientCategory" ADD VALUE 'OTHER_EQUIPMENT';
