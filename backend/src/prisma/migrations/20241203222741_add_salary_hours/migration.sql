/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `employees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetPasswordToken]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `ingredients` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `unit` on the `ingredients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'PIECE', 'TEASPOON', 'TABLESPOON', 'CUP', 'OUNCE', 'POUND', 'CAN');

-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('PRODUCE', 'DAIRY', 'MEAT', 'SEAFOOD', 'BAKERY', 'PANTRY', 'FROZEN', 'BEVERAGE', 'ALCOHOL', 'OTHER', 'SPICES', 'CONDIMENTS', 'SNACKS', 'GRAINS', 'LEGUMES', 'EXTRA_SAUCES', 'INGREDIENT_SAUCE', 'SWEETS', 'HERBS');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('REGULAR', 'LUNCH', 'DINNER', 'BREAKFAST', 'KIDS', 'SPECIAL', 'COMBO', 'VALUE_MEAL', 'SEASONAL', 'HOLIDAY', 'CATERING');

-- DropForeignKey
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_supplierId_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "deletedAt",
ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginIP" TEXT,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "salaryHours" DECIMAL(10,2),
ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "category" "IngredientCategory" NOT NULL,
ADD COLUMN     "extraPrice" DECIMAL(10,2),
ADD COLUMN     "isExtra" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reorderAmount" DECIMAL(10,3) NOT NULL DEFAULT 0,
DROP COLUMN "unit",
ADD COLUMN     "unit" "MeasurementUnit" NOT NULL,
ALTER COLUMN "supplierId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "freeExtraItems" "IngredientCategory"[] DEFAULT ARRAY[]::"IngredientCategory"[],
ADD COLUMN     "freeExtras" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MenuType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "daysOfWeek" "Weekday"[],
    "basePrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxQuantity" INTEGER,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "specialPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_items_menuId_idx" ON "menu_items"("menuId");

-- CreateIndex
CREATE INDEX "menu_items_productId_idx" ON "menu_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_resetPasswordToken_key" ON "employees"("resetPasswordToken");

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
