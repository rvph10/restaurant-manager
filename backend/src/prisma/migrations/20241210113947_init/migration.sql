-- AlterTable
ALTER TABLE "queue_items" ADD COLUMN     "groupComplete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "stations" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "station_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "station_groups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "station_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
