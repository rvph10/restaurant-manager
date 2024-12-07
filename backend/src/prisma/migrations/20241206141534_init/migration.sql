/*
  Warnings:

  - Changed the type of `type` on the `Station` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StationType" AS ENUM ('PREP', 'COOK', 'ASSEMBLY', 'DELIVERY', 'CLEANING', 'BAR', 'BAKERY', 'GRILL', 'FRY', 'SALAD', 'DESSERT', 'BEVERAGE');

-- AlterTable
ALTER TABLE "Station" DROP COLUMN "type",
ADD COLUMN     "type" "StationType" NOT NULL;
