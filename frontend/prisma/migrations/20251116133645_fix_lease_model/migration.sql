/*
  Warnings:

  - You are about to drop the column `dueDay` on the `Lease` table. All the data in the column will be lost.
  - You are about to alter the column `rentAmount` on the `Lease` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `apartmentId` to the `Lease` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `Lease` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lease" DROP COLUMN "dueDay",
ADD COLUMN     "apartmentId" TEXT NOT NULL,
ADD COLUMN     "dueDate" INTEGER NOT NULL,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "rentAmount" SET DATA TYPE INTEGER;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
