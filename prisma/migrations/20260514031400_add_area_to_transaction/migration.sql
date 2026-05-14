-- AlterTable - Add missing columns to Transaction
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "area" TEXT NOT NULL DEFAULT 'Outros';
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "referenceType" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "referenceId" TEXT;
