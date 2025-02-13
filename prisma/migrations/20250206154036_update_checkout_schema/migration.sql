/*
  Warnings:

  - You are about to drop the column `userId` on the `Checkout` table. All the data in the column will be lost.
  - Added the required column `studentEmail` to the `Checkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Checkout` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Checkout" DROP CONSTRAINT "Checkout_userId_fkey";

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "availableQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'available';

-- AlterTable
ALTER TABLE "Checkout" DROP COLUMN "userId",
ADD COLUMN     "checkoutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "returnDate" TIMESTAMP(3),
ADD COLUMN     "studentEmail" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_studentEmail_fkey" FOREIGN KEY ("studentEmail") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
