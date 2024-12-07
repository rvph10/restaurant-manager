-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "isIndependent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WorkflowStep" ADD COLUMN     "isIndependent" BOOLEAN NOT NULL DEFAULT false;
