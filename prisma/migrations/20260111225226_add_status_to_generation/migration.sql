-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING';
