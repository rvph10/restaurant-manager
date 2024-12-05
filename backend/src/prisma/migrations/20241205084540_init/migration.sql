/*
  Warnings:

  - Changed the type of `priceModifier` on the `option_choices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "option_choices" DROP COLUMN "priceModifier",
ADD COLUMN     "priceModifier" JSONB NOT NULL;
