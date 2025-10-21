-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "apartmentId" TEXT;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
