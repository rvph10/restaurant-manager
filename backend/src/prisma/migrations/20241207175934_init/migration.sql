/*
  Warnings:

  - Added the required column `icon` to the `Station` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "icon" TEXT NOT NULL;
