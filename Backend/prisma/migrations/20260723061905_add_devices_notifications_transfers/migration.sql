-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('YENI_TALEP', 'TALEP_ATANDI', 'TALEP_DEVREDILDI', 'TALEP_DURUM_DEGISTI', 'DEVIR_ISTEGI_ALINDI', 'DEVIR_ISTEGI_SONUCLANDI');

-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TicketLogType" ADD VALUE 'UZMANLIGA_AKTARILDI';
ALTER TYPE "TicketLogType" ADD VALUE 'DEVIR_ISTENDI';
ALTER TYPE "TicketLogType" ADD VALUE 'DEVIR_KABUL_EDILDI';
ALTER TYPE "TicketLogType" ADD VALUE 'DEVIR_REDDEDILDI';
ALTER TYPE "TicketLogType" ADD VALUE 'DEVIR_IPTAL_EDILDI';

-- AlterTable
ALTER TABLE "ticket_logs" ADD COLUMN     "deviceId" INTEGER;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "deviceId" INTEGER;

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT NOT NULL DEFAULT 'Bilinmiyor',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ticketId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_transfers" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "fromUserId" INTEGER,
    "toSpecializationId" INTEGER NOT NULL,
    "toUserId" INTEGER,
    "reason" TEXT NOT NULL,
    "workDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_requests" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "requestedToId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'PENDING',
    "responseNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "handover_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_ipAddress_hostname_key" ON "devices"("ipAddress", "hostname");

-- CreateIndex
CREATE INDEX "login_logs_userId_idx" ON "login_logs"("userId");

-- CreateIndex
CREATE INDEX "login_logs_deviceId_idx" ON "login_logs"("deviceId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_ticketId_idx" ON "notifications"("ticketId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "ticket_transfers_ticketId_idx" ON "ticket_transfers"("ticketId");

-- CreateIndex
CREATE INDEX "handover_requests_ticketId_idx" ON "handover_requests"("ticketId");

-- CreateIndex
CREATE INDEX "handover_requests_requestedToId_idx" ON "handover_requests"("requestedToId");

-- CreateIndex
CREATE INDEX "handover_requests_status_idx" ON "handover_requests"("status");

-- CreateIndex
CREATE INDEX "ticket_logs_deviceId_idx" ON "ticket_logs"("deviceId");

-- CreateIndex
CREATE INDEX "tickets_deviceId_idx" ON "tickets"("deviceId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_logs" ADD CONSTRAINT "ticket_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_toSpecializationId_fkey" FOREIGN KEY ("toSpecializationId") REFERENCES "specializations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_requests" ADD CONSTRAINT "handover_requests_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_requests" ADD CONSTRAINT "handover_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_requests" ADD CONSTRAINT "handover_requests_requestedToId_fkey" FOREIGN KEY ("requestedToId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bir talep için aynı anda yalnızca bir PENDING devir isteği olabilir.
-- Prisma şemasında ifade edilemeyen kısmi (partial) bir unique index
-- olduğu için elle ekleniyor; çift kabul/çift istek yarış durumunu
-- $transaction'a gerek kalmadan DB seviyesinde engeller.
CREATE UNIQUE INDEX IF NOT EXISTS "handover_requests_one_pending_per_ticket"
  ON "handover_requests" ("ticketId") WHERE "status" = 'PENDING';
