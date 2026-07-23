-- DropForeignKey
ALTER TABLE "ticket_transfers" DROP CONSTRAINT "ticket_transfers_toSpecializationId_fkey";

-- AlterTable
ALTER TABLE "ticket_transfers" ALTER COLUMN "toSpecializationId" DROP NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_toSpecializationId_fkey" FOREIGN KEY ("toSpecializationId") REFERENCES "specializations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
