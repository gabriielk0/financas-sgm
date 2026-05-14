-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "area" TEXT NOT NULL DEFAULT 'Outros';
