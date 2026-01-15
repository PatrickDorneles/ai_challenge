-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "lastError" VARCHAR(2000),
ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]::VARCHAR(2048)[];
