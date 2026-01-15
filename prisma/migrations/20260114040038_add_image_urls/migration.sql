-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "imageUrls" VARCHAR(2048)[],
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3);
