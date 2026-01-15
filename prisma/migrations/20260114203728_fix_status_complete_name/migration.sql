/*
  Warnings:

  - The values [COMPLETED] on the enum `generation_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "generation_status_new" AS ENUM ('PENDING', 'FAILED', 'COMPLETE');
ALTER TABLE "generations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "generations" ALTER COLUMN "status" TYPE "generation_status_new" USING ("status"::text::"generation_status_new");
ALTER TYPE "generation_status" RENAME TO "generation_status_old";
ALTER TYPE "generation_status_new" RENAME TO "generation_status";
DROP TYPE "generation_status_old";
ALTER TABLE "generations" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
