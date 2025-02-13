-- DropForeignKey
ALTER TABLE "Checkout" DROP CONSTRAINT "Checkout_studentEmail_fkey";

-- AlterTable
ALTER TABLE "Book" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Checkout" ADD COLUMN "synced" BOOLEAN NOT NULL DEFAULT false;

-- Add default value for existing rows
UPDATE "Book" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
