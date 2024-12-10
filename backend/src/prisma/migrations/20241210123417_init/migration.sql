/*
  Warnings:

  - You are about to drop the column `groupComplete` on the `queue_items` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the `station_groups` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "stations" DROP CONSTRAINT "stations_groupId_fkey";

-- AlterTable
ALTER TABLE "queue_items" DROP COLUMN "groupComplete";

-- AlterTable
ALTER TABLE "stations" DROP COLUMN "groupId";

-- DropTable
DROP TABLE "station_groups";
