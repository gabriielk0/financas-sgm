import FinancasFrame from '@/components/financas/FinancasFrame';
import PagamentosFinanceTable from '@/components/financas/PagamentosFinanceTable';
import { listarReembolsosFinanceiro } from '@/app/actions/reembolsos';
import { listarPagamentosFinanceiro } from '@/app/actions/pagamentos';
import { SolicitacaoFinanceiro } from '@/types/reembolso';

export default async function FinancasPagamentosPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const busca = typeof searchParams?.busca === 'string' ? searchParams.busca : undefined;
  const status = typeof searchParams?.status === 'string' ? searchParams.status : undefined;
  const equipe = typeof searchParams?.equipe === 'string' ? searchParams.equipe : undefined;

  const [reembolsosRaw, pagamentosRaw] = await Promise.all([
    listarReembolsosFinanceiro({ busca, status, equipe }),
    listarPagamentosFinanceiro({ busca, status, equipe }),
  ]);

  const reembolsosParsed: SolicitacaoFinanceiro[] = reembolsosRaw.map(r => ({
    tipo: 'reembolso',
    id: r.id,
    descricao: r.descricao,
    finalidade: r.finalidade,
    valor: r.valor,
    status: r.status,
    equipe: r.equipe,
    criado_em: r.criado_em,
    usuario: r.usuario,
    chave_pix: r.chave_pix,
    anexo_url: r.anexo_url,
    historico: r.historico,
    lancamento_id: r.lancamento_id,
    valor_aprovado: r.valor_aprovado,
  }));

  const pagamentosParsed: SolicitacaoFinanceiro[] = pagamentosRaw.map(p => ({
    tipo: 'orcamento',
    id: p.id,
    descricao: p.descricao,
    finalidade: p.finalidade,
    valor: p.valor_total,
    status: p.status,
    equipe: p.equipe,
    criado_em: p.criado_em,
    usuario: p.usuario,
    fornecedor: p.fornecedor,
    anexo_url: p.anexo_orcamento_url,
    anexo_nf_url: p.anexo_nf_url,
    numero_nf: p.numero_nf,
    historico: p.historico,
    lancamento_id: p.lancamento_id,
    valor_aprovado: p.valor_aprovado,
    observacoes: p.observacoes,
  }));

  const solicitacoes: SolicitacaoFinanceiro[] = [...reembolsosParsed, ...pagamentosParsed]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  return (
    <FinancasFrame>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Solicitações de Pagamento</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie reembolsos e aprovações de pagamentos de orçamentos.
          </p>
        </div>

        <PagamentosFinanceTable solicitacoes={solicitacoes} />
      </main>
    </FinancasFrame>
  );
}
