import DashboardStats from '@/components/DashboardStats';
import FinanceHeaderControls from '@/components/financas/FinanceHeaderControls';
import FinancasFrame from '@/components/financas/FinancasFrame';
import TransactionTable from '@/components/TransactionTable';
import TransactionFilters from '@/components/TransactionFilters';
import { getFinanceViewData } from '../finance-data';

export default async function FinancasLancamentosPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { activeMonth, displayMonthBalance, monthsHistory, transactions, view } =
    await getFinanceViewData(searchParams);

  return (
    <FinancasFrame>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!activeMonth || !displayMonthBalance ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
            Não foi possível carregar os lançamentos.
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Lançamentos
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Entradas e saídas do financeiro.
                </p>
              </div>
              <FinanceHeaderControls
                activeMonth={activeMonth}
                monthsHistory={monthsHistory}
                view={view}
                basePath="/financas/lancamentos"
              />
            </div>

            <DashboardStats
              monthBalance={displayMonthBalance}
              transactions={transactions}
            />

            {view === 'monthly' ? (
              <>
                <TransactionFilters />
                <TransactionTable
                  transactions={transactions}
                  monthClosed={activeMonth.isClosed}
                  monthId={activeMonth.id}
                />
              </>
            ) : (
              <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-400">
                A tabela detalhada fica disponível na visão mensal.
              </div>
            )}
          </>
        )}
      </main>
    </FinancasFrame>
  );
}
