-- DropIndex
DROP INDEX "Attachment_transactionId_idx";

-- DropIndex
DROP INDEX "reembolsos_status_idx";

-- DropIndex
DROP INDEX "reembolsos_usuario_id_idx";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "area" TEXT NOT NULL DEFAULT 'Outros';
