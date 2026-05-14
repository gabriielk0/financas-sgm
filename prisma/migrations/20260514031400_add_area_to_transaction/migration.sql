-- ===================================================
-- Migração: Sincronizar banco de produção com o schema
-- Adiciona colunas e tabelas que faltam no banco remoto
-- ===================================================

-- 1. Colunas faltando na tabela Transaction
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

-- 2. Coluna faltando na tabela reembolsos
ALTER TABLE "reembolsos" ADD COLUMN IF NOT EXISTS "valor_aprovado" DOUBLE PRECISION;

-- 3. Criar tabela reembolso_history (caso não exista)
CREATE TABLE IF NOT EXISTS "reembolso_history" (
    "id" TEXT NOT NULL,
    "reembolso_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reembolso_history_pkey" PRIMARY KEY ("id")
);

-- 4. Foreign Keys para reembolso_history (IF NOT EXISTS via DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reembolso_history_reembolso_id_fkey'
    ) THEN
        ALTER TABLE "reembolso_history"
        ADD CONSTRAINT "reembolso_history_reembolso_id_fkey"
        FOREIGN KEY ("reembolso_id") REFERENCES "reembolsos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reembolso_history_usuario_id_fkey'
    ) THEN
        ALTER TABLE "reembolso_history"
        ADD CONSTRAINT "reembolso_history_usuario_id_fkey"
        FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
