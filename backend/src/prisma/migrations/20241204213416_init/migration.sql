-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "extraPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "modifications" JSONB;
