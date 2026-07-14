-- CreateTable
CREATE TABLE IF NOT EXISTS "specializations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_SpecializationToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SpecializationToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "specializations_name_key" ON "specializations"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_SpecializationToUser_B_index" ON "_SpecializationToUser"("B");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_SpecializationToUser_A_fkey'
  ) THEN
    ALTER TABLE "_SpecializationToUser"
      ADD CONSTRAINT "_SpecializationToUser_A_fkey"
      FOREIGN KEY ("A") REFERENCES "specializations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_SpecializationToUser_B_fkey'
  ) THEN
    ALTER TABLE "_SpecializationToUser"
      ADD CONSTRAINT "_SpecializationToUser_B_fkey"
      FOREIGN KEY ("B") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Varsayılan uzmanlık alanı
INSERT INTO "specializations" ("name", "description", "isActive", "createdAt", "updatedAt")
VALUES ('Diğer', 'Genel ve tanımsız talepler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Kategorilere uzmanlık alanı bağlantısı
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "specializationId" INTEGER;

UPDATE "categories"
SET "specializationId" = (SELECT "id" FROM "specializations" WHERE "name" = 'Diğer' LIMIT 1)
WHERE "specializationId" IS NULL;

ALTER TABLE "categories" ALTER COLUMN "specializationId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_specializationId_fkey'
  ) THEN
    ALTER TABLE "categories"
      ADD CONSTRAINT "categories_specializationId_fkey"
      FOREIGN KEY ("specializationId") REFERENCES "specializations"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "categories_specializationId_idx" ON "categories"("specializationId");
