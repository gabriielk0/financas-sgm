import FinanceFilters from '@/components/financas/FinanceFilters';
import ExportControls from '@/components/financas/ExportControls';
import { getReembolsoReportData, ReportFilters } from '@/app/actions/reports';
import { Receipt, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default async function ReembolsosReportPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const filters: ReportFilters = {
    equipe: searchParams?.equipe as string | undefined,
    status: searchParams?.status as string | undefined,
    startDate: searchParams?.startDate ? new Date(searchParams.startDate as string) : undefined,
    endDate: searchParams?.endDate ? new Date(searchParams.endDate as string) : undefined,
  };

  const data = await getReembolsoReportData(filters);

  // Preparar dados para CSV
  const csvData = data.lista.map((r) => ({
    Data: new Date(r.criado_em).toLocaleString('pt-BR'),
    Solicitante: r.usuario.nome,
    Equipe: r.equipe,
    Descricao: r.descricao,
    Finalidade: r.finalidade,
    Valor_Solicitado: r.valor,
    Valor_Aprovado: r.valor_aprovado ?? r.valor,
    Status: r.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" /> Relatório de Reembolsos
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Métricas e histórico detalhado das solicitações</p>
        </div>
        <ExportControls dataToExport={csvData} exportFileName="relatorio-reembolsos" />
      </div>

      <div className="print:hidden">
        <FinanceFilters showType={false} />
      </div>

      {/* Cabeçalho Impressão */}
      <div className="hidden print:block mb-8 text-center border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-bold">Relatório de Reembolsos</h1>
        <p className="text-sm text-zinc-500 mt-1">Gerado em {new Date().toLocaleString('pt-BR')}</p>
        {(filters.startDate || filters.endDate || filters.equipe) && (
          <p className="text-sm text-zinc-500 mt-1">
            Filtros: {filters.equipe || 'Todas as equipes'} | 
            {filters.startDate ? ` De ${filters.startDate.toLocaleDateString('pt-BR')}` : ''}
            {filters.endDate ? ` Até ${filters.endDate.toLocaleDateString('pt-BR')}` : ''}
          </p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-zinc-400 mb-1">Total Solicitado</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.kpis.totalSolicitado)}</p>
          <p className="text-xs text-zinc-500 mt-1">{data.kpis.quantidade} pedidos</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-emerald-400/80 mb-1">Total Aprovado</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.kpis.totalAprovado)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-indigo-400/80 mb-1">Total Pago</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(data.kpis.totalPago)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-rose-400/80 mb-1">Total Rejeitado</p>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(data.kpis.totalRejeitado)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-zinc-400 mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.kpis.mediaValor)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tabela de Equipes */}
        <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-800">
            <h3 className="font-semibold text-white">Resumo por Equipe</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Equipe</th>
                  <th className="px-4 py-3 font-medium text-right">Solicitado</th>
                  <th className="px-4 py-3 font-medium text-right">Aprovado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.porEquipe.map((eq) => (
                  <tr key={eq.equipe} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-300">
                      {eq.equipe} <span className="text-zinc-500 font-normal text-xs ml-1">({eq.count})</span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">{formatCurrency(eq.totalSolicitado)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(eq.totalAprovado)}</td>
                  </tr>
                ))}
                {data.porEquipe.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">Nenhum dado encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista Detalhada */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-semibold text-white">Histórico de Solicitações</h3>
            <span className="text-xs text-zinc-500">{data.lista.length} registros</span>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Solicitante</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.lista.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{new Date(r.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {r.usuario.nome}
                      <div className="text-xs text-zinc-500">{r.equipe}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 max-w-[200px] truncate" title={r.descricao}>{r.descricao}</td>
                    <td className="px-4 py-3">
                      {r.status === 'pendente_reembolso' && <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md"><AlertCircle className="w-3 h-3"/> Pendente</span>}
                      {r.status === 'aprovado' && <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md"><CheckCircle2 className="w-3 h-3"/> Aprovado</span>}
                      {r.status === 'pago' && <span className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md"><CheckCircle2 className="w-3 h-3"/> Pago</span>}
                      {r.status === 'rejeitado' && <span className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-400/10 px-2 py-1 rounded-md"><Ban className="w-3 h-3"/> Rejeitado</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium text-white">{formatCurrency(r.valor)}</div>
                      {r.valor_aprovado !== null && r.valor_aprovado !== r.valor && (
                        <div className="text-xs text-emerald-400">Apr: {formatCurrency(r.valor_aprovado)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
