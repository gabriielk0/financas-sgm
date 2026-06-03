-- CreateTable
CREATE TABLE "pagamentos_orcamento" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "finalidade" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor_total" DOUBLE PRECISION NOT NULL,
    "equipe" TEXT NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "anexo_orcamento_url" TEXT NOT NULL,
    "anexo_nf_url" TEXT,
    "numero_nf" TEXT,
    "data_emissao_nf" TIMESTAMP(3),
    "valor_aprovado" DOUBLE PRECISION,
    "motivo_rejeicao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente_aprovacao',
    "lancamento_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento_orcamento_history" (
    "id" TEXT NOT NULL,
    "pagamento_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamento_orcamento_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_orcamento_lancamento_id_key" ON "pagamentos_orcamento"("lancamento_id");

-- AddForeignKey
ALTER TABLE "pagamentos_orcamento" ADD CONSTRAINT "pagamentos_orcamento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_orcamento" ADD CONSTRAINT "pagamentos_orcamento_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_orcamento_history" ADD CONSTRAINT "pagamento_orcamento_history_pagamento_id_fkey" FOREIGN KEY ("pagamento_id") REFERENCES "pagamentos_orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_orcamento_history" ADD CONSTRAINT "pagamento_orcamento_history_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
