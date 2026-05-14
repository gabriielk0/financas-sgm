import FinanceFilters from '@/components/financas/FinanceFilters';
import ExportControls from '@/components/financas/ExportControls';
import { getTeamReportData, ReportFilters } from '@/app/actions/reports';
import { Users, TrendingUp, TrendingDown, Activity } from 'lucide-react';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default async function EquipesReportPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const filters: ReportFilters = {
    equipe: searchParams?.equipe as string | undefined,
    startDate: searchParams?.startDate ? new Date(searchParams.startDate as string) : undefined,
    endDate: searchParams?.endDate ? new Date(searchParams.endDate as string) : undefined,
  };

  const data = await getTeamReportData(filters);

  // Preparar dados para CSV
  const csvData = data.ranking.map((r: any, index: number) => ({
    Posicao: index + 1,
    Equipe: r.area,
    Total_Gasto: r.totalGasto,
    Gasto_Concluido: r.concluido,
    Gasto_Pendente: r.pendente,
    Quantidade_Lancamentos: r.quantidade,
    Percentual_do_Total: `${r.percentual.toFixed(2)}%`,
  }));

  const topEquipe = data.ranking.length > 0 ? data.ranking[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Relatório por Área/Equipe
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Ranking de custos e participação no orçamento geral</p>
        </div>
        <ExportControls dataToExport={csvData} exportFileName="relatorio-equipes" />
      </div>

      <div className="print:hidden">
        <FinanceFilters showType={false} showStatus={false} />
      </div>

      {/* Cabeçalho Impressão */}
      <div className="hidden print:block mb-8 text-center border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-bold">Relatório Financeiro por Equipe</h1>
        <p className="text-sm text-zinc-500 mt-1">Gerado em {new Date().toLocaleString('pt-BR')}</p>
        {(filters.startDate || filters.endDate || filters.equipe) && (
          <p className="text-sm text-zinc-500 mt-1">
            Filtros: {filters.equipe || 'Todas as equipes'} | 
            {filters.startDate ? ` De ${filters.startDate.toLocaleDateString('pt-BR')}` : ''}
            {filters.endDate ? ` Até ${filters.endDate.toLocaleDateString('pt-BR')}` : ''}
          </p>
        )}
      </div>

      {/* Cards Estratégicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Activity className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-zinc-400 mb-1">Custo Total do Período</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(data.totalGeral)}</p>
          <p className="text-sm text-zinc-500 mt-1">{data.quantidadeTotal} lançamentos de saída</p>
        </div>
        
        {topEquipe ? (
          <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-indigo-400">
              <TrendingUp className="w-16 h-16" />
            </div>
            <p className="text-sm font-medium text-indigo-400 mb-1">Área com Maior Gasto</p>
            <p className="text-2xl font-bold text-white">{topEquipe.area}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-indigo-300">{formatCurrency(topEquipe.totalGasto)}</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                {topEquipe.percentual.toFixed(1)}% do total
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-sm flex items-center justify-center text-zinc-500 text-sm">
            Nenhuma despesa encontrada
          </div>
        )}
      </div>

      {/* Tabela de Ranking */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Ranking de Custos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium w-16">#</th>
                <th className="px-6 py-4 font-medium">Equipe / Área</th>
                <th className="px-6 py-4 font-medium text-center">Lançamentos</th>
                <th className="px-6 py-4 font-medium text-right">Total Gasto</th>
                <th className="px-6 py-4 font-medium text-right w-48">Participação (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.ranking.map((r: any, index: number) => (
                <tr key={r.area} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-zinc-500 font-medium">{index + 1}º</td>
                  <td className="px-6 py-4 font-medium text-zinc-200">{r.area}</td>
                  <td className="px-6 py-4 text-center text-zinc-400">{r.quantidade}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-white">{formatCurrency(r.totalGasto)}</span>
                    {r.pendente > 0 && (
                      <div className="text-xs text-amber-400 mt-1">({formatCurrency(r.pendente)} pendente)</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-zinc-300 font-medium w-12 text-right">{r.percentual.toFixed(1)}%</span>
                      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${r.percentual}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {data.ranking.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Nenhum dado encontrado para os filtros selecionados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
