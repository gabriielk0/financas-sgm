import type { Prisma } from '@prisma/client';

export type ReembolsoPendente = Prisma.ReembolsoGetPayload<{
  include: { 
    usuario: true;
    historico: true;
    lancamento: true;
  };
}>;

export type SolicitacaoFinanceiro = {
  tipo: 'reembolso' | 'orcamento';
  id: string;
  descricao: string;
  finalidade: string;
  valor: number;
  status: string;
  equipe: string;
  criado_em: Date;
  usuario: { nome: string; whatsapp: string };
  chave_pix?: string | null;
  fornecedor?: string | null;
  anexo_url: string;
  anexo_nf_url?: string | null;
  numero_nf?: string | null;
  historico: any[];
  lancamento_id?: string | null;
  valor_aprovado?: number | null;
};
