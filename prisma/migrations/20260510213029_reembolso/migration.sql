-- AlterTable
ALTER TABLE "Transaction"
ADD COLUMN "referenceType" TEXT,
ADD COLUMN "referenceId" TEXT;

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "equipe" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando_aprovacao',
    "perfil" TEXT NOT NULL DEFAULT 'equipe',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reembolsos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nome_pagador" TEXT NOT NULL,
    "equipe" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "finalidade" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "chave_pix" TEXT NOT NULL,
    "anexo_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente_reembolso',
    "motivo_rejeicao" TEXT,
    "lancamento_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reembolsos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reembolsos_lancamento_id_key" ON "reembolsos"("lancamento_id");

-- CreateIndex
CREATE INDEX "reembolsos_usuario_id_idx" ON "reembolsos"("usuario_id");

-- CreateIndex
CREATE INDEX "reembolsos_status_idx" ON "reembolsos"("status");

-- AddForeignKey
ALTER TABLE "reembolsos"
ADD CONSTRAINT "reembolsos_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reembolsos"
ADD CONSTRAINT "reembolsos_lancamento_id_fkey"
FOREIGN KEY ("lancamento_id") REFERENCES "Transaction"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
