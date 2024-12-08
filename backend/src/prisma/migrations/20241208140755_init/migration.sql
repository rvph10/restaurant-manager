/*
  Warnings:

  - You are about to drop the column `stepOrder` on the `WorkflowStep` table. All the data in the column will be lost.
  - Added the required column `stepOrder` to the `Station` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "stepOrder" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowStep" DROP COLUMN "stepOrder";
