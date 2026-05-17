import { Suspense } from 'react';
import Charts from '@/components/Charts';
import DashboardStats from '@/components/DashboardStats';
import FinancasFrame from '@/components/financas/FinancasFrame';
import FinanceHeaderControls from '@/components/financas/FinanceHeaderControls';
import CardsSkeleton from '@/components/skeletons/CardsSkeleton';
import ChartSkeleton from '@/components/skeletons/ChartSkeleton';
import { getFinanceViewData, type FinanceSearchParams } from '../finance-data';

type PageSearchParams = { [key: string]: string | string[] | undefined };

async function DashboardCards({
  searchParams,
}: {
  searchParams?: FinanceSearchParams;
}) {
  const { activeMonth, displayMonthBalance, transactions } =
    await getFinanceViewData(searchParams);

  if (!activeMonth || !displayMonthBalance) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
        Nao foi possivel carregar os cards do dashboard.
      </div>
    );
  }

  return (
    <DashboardStats
      monthBalance={displayMonthBalance}
      transactions={transactions}
    />
  );
}

async function DashboardCharts({
  searchParams,
}: {
  searchParams?: FinanceSearchParams;
}) {
  const { activeMonth, monthsHistory, transactions, view } =
    await getFinanceViewData(searchParams);

  if (!activeMonth) {
    return (
      <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
        Nao foi possivel carregar os graficos.
      </div>
    );
  }

  return (
    <Charts monthsHistory={monthsHistory} transactions={transactions} view={view} />
  );
}

export default async function FinancasDashboardPage(props: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const { activeMonth, monthsHistory, view } = await getFinanceViewData(
    searchParams,
  );

  return (
    <FinancasFrame>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!activeMonth ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
            Nao foi possivel carregar os dados financeiros.
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Dashboard Financeiro
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Visao geral de {String(activeMonth.month).padStart(2, '0')}/
                  {activeMonth.year}
                </p>
              </div>
              <FinanceHeaderControls
                activeMonth={activeMonth}
                monthsHistory={monthsHistory}
                view={view}
                basePath="/financas/dashboard"
              />
            </div>

            <Suspense fallback={<CardsSkeleton />}>
              <DashboardCards searchParams={searchParams} />
            </Suspense>

            <Suspense fallback={<ChartSkeleton />}>
              <DashboardCharts searchParams={searchParams} />
            </Suspense>
          </>
        )}
      </main>
    </FinancasFrame>
  );
}
