/*
  Warnings:

  - Added the required column `typeId` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "typeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
