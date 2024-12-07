/*
  Warnings:

  - You are about to drop the `_CategoryToPrepare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kitchen_order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kitchen_queues` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kitchen_staff_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kitchen_stations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `production_lines` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `production_steps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `station_steps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `step_progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- DropForeignKey
ALTER TABLE "_CategoryToPrepare" DROP CONSTRAINT "_CategoryToPrepare_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToPrepare" DROP CONSTRAINT "_CategoryToPrepare_B_fkey";

-- DropForeignKey
ALTER TABLE "kitchen_order_items" DROP CONSTRAINT "kitchen_order_items_queueId_fkey";

-- DropForeignKey
ALTER TABLE "kitchen_queues" DROP CONSTRAINT "kitchen_queues_stationId_fkey";

-- DropForeignKey
ALTER TABLE "kitchen_staff_assignments" DROP CONSTRAINT "kitchen_staff_assignments_stationId_fkey";

-- DropForeignKey
ALTER TABLE "production_steps" DROP CONSTRAINT "production_steps_productionLineId_fkey";

-- DropForeignKey
ALTER TABLE "station_steps" DROP CONSTRAINT "station_steps_stationId_fkey";

-- DropForeignKey
ALTER TABLE "station_steps" DROP CONSTRAINT "station_steps_stepId_fkey";

-- DropForeignKey
ALTER TABLE "step_progress" DROP CONSTRAINT "step_progress_orderProgressId_fkey";

-- DropTable
DROP TABLE "_CategoryToPrepare";

-- DropTable
DROP TABLE "kitchen_order_items";

-- DropTable
DROP TABLE "kitchen_queues";

-- DropTable
DROP TABLE "kitchen_staff_assignments";

-- DropTable
DROP TABLE "kitchen_stations";

-- DropTable
DROP TABLE "order_progress";

-- DropTable
DROP TABLE "production_lines";

-- DropTable
DROP TABLE "production_steps";

-- DropTable
DROP TABLE "station_steps";

-- DropTable
DROP TABLE "step_progress";

-- DropEnum
DROP TYPE "PreparationStatus";

-- DropEnum
DROP TYPE "QueueStatus";

-- DropEnum
DROP TYPE "RecipeComplexity";

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "displayLimit" INTEGER NOT NULL,
    "currentLoad" INTEGER NOT NULL DEFAULT 0,
    "maxCapacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stations" TEXT[],
    "stepOrder" INTEGER NOT NULL,
    "isParallel" BOOLEAN NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "priority" "OrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ItemStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "waitTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueItem" ADD CONSTRAINT "QueueItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueItem" ADD CONSTRAINT "QueueItem_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
