import FinanceFilters from '@/components/financas/FinanceFilters';
import ExportControls from '@/components/financas/ExportControls';
import { getConsolidatedReportData, ReportFilters } from '@/app/actions/reports';
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default async function ConsolidadoReportPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const filters: ReportFilters = {
    startDate: searchParams?.startDate ? new Date(searchParams.startDate as string) : undefined,
    endDate: searchParams?.endDate ? new Date(searchParams.endDate as string) : undefined,
  };

  const data = await getConsolidatedReportData(filters);

  // Preparar dados para CSV
  const csvData = [
    {
      Metrica: 'Total de Entradas',
      Valor: data.metrics.entradas,
      Concluidas: data.metrics.entradasConcluidas,
      Pendentes: data.metrics.entradasPendentes
    },
    {
      Metrica: 'Total de Saídas',
      Valor: data.metrics.saidas,
      Concluidas: data.metrics.saidasConcluidas,
      Pendentes: data.metrics.saidasPendentes
    },
    {
      Metrica: 'Saldo Atual (Realizado)',
      Valor: data.saldoAtual,
      Concluidas: data.saldoAtual,
      Pendentes: 0
    },
    {
      Metrica: 'Saldo Previsto (Final)',
      Valor: data.saldoPrevisto,
      Concluidas: data.saldoPrevisto,
      Pendentes: 0
    }
  ];

  const lucroOuPrejuizo = data.saldoPrevisto >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-400" /> Relatório Consolidado
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Visão macro de entradas, saídas e previsões financeiras</p>
        </div>
        <ExportControls dataToExport={csvData} exportFileName="relatorio-consolidado" />
      </div>

      <div className="print:hidden">
        <FinanceFilters showTeam={false} showStatus={false} showType={false} showSearch={false} />
      </div>

      {/* Cabeçalho Impressão */}
      <div className="hidden print:block mb-8 text-center border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-bold">Relatório Financeiro Consolidado</h1>
        <p className="text-sm text-zinc-500 mt-1">Gerado em {new Date().toLocaleString('pt-BR')}</p>
        {(filters.startDate || filters.endDate) && (
          <p className="text-sm text-zinc-500 mt-1">
            Filtros: 
            {filters.startDate ? ` De ${filters.startDate.toLocaleDateString('pt-BR')}` : ''}
            {filters.endDate ? ` Até ${filters.endDate.toLocaleDateString('pt-BR')}` : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entradas */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ArrowUpRight className="w-5 h-5" />
            <span className="font-semibold">Entradas</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(data.metrics.entradas)}</p>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Realizado:</span>
              <span className="text-emerald-400">{formatCurrency(data.metrics.entradasConcluidas)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Pendente:</span>
              <span className="text-amber-400">{formatCurrency(data.metrics.entradasPendentes)}</span>
            </div>
          </div>
        </div>

        {/* Saidas */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <ArrowDownRight className="w-5 h-5" />
            <span className="font-semibold">Saídas</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(data.metrics.saidas)}</p>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Realizado:</span>
              <span className="text-rose-400">{formatCurrency(data.metrics.saidasConcluidas)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Pendente:</span>
              <span className="text-amber-400">{formatCurrency(data.metrics.saidasPendentes)}</span>
            </div>
          </div>
        </div>

        {/* Saldo Atual */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="font-semibold">Saldo Atual (Realizado)</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(data.saldoAtual)}</p>
          <p className="text-xs text-zinc-500 mt-2">Apenas lançamentos concluídos/pagos</p>
        </div>

        {/* Saldo Previsto */}
        <div className={`p-6 rounded-2xl shadow-sm border ${lucroOuPrejuizo ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <div className={`flex items-center gap-2 mb-2 ${lucroOuPrejuizo ? 'text-indigo-400' : 'text-rose-400'}`}>
            {lucroOuPrejuizo ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span className="font-semibold">Resultado Final Previsto</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(data.saldoPrevisto)}</p>
          <p className="text-xs text-zinc-400 mt-2">
            {lucroOuPrejuizo ? 'Previsão de superávit no período' : 'Previsão de déficit no período'}
          </p>
        </div>
      </div>

      {/* Detalhamento Tabela */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm mt-8">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Detalhamento do Resumo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Indicador</th>
                <th className="px-6 py-4 font-medium text-right">Realizado (Concluído)</th>
                <th className="px-6 py-4 font-medium text-right">A Realizar (Pendente)</th>
                <th className="px-6 py-4 font-medium text-right">Total Previsto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              <tr className="hover:bg-zinc-800/30">
                <td className="px-6 py-4 font-medium text-emerald-400">Total de Entradas (+)</td>
                <td className="px-6 py-4 text-right text-zinc-300">{formatCurrency(data.metrics.entradasConcluidas)}</td>
                <td className="px-6 py-4 text-right text-amber-400">{formatCurrency(data.metrics.entradasPendentes)}</td>
                <td className="px-6 py-4 text-right font-semibold text-emerald-400">{formatCurrency(data.metrics.entradas)}</td>
              </tr>
              <tr className="hover:bg-zinc-800/30">
                <td className="px-6 py-4 font-medium text-rose-400">Total de Saídas (-)</td>
                <td className="px-6 py-4 text-right text-zinc-300">{formatCurrency(data.metrics.saidasConcluidas)}</td>
                <td className="px-6 py-4 text-right text-amber-400">{formatCurrency(data.metrics.saidasPendentes)}</td>
                <td className="px-6 py-4 text-right font-semibold text-rose-400">{formatCurrency(data.metrics.saidas)}</td>
              </tr>
              <tr className="bg-zinc-950/30">
                <td className="px-6 py-4 font-bold text-white">Resultado Operacional</td>
                <td className="px-6 py-4 text-right font-bold text-white">{formatCurrency(data.saldoAtual)}</td>
                <td className="px-6 py-4 text-right text-amber-400">{formatCurrency(data.metrics.entradasPendentes - data.metrics.saidasPendentes)}</td>
                <td className="px-6 py-4 text-right font-bold text-indigo-400">{formatCurrency(data.saldoPrevisto)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
