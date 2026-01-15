/*
  Warnings:

  - The `status` column on the `generations` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "generation_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "generations" DROP COLUMN "status",
ADD COLUMN     "status" "generation_status" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "GenerationStatus";
