import { getCurrentMonth, getMonths, getTransactions } from './actions/finance';
import DashboardStats from '@/components/DashboardStats';
import Charts from '@/components/Charts';
import TransactionTable from '@/components/TransactionTable';
import MonthSelector from '@/components/MonthSelector';
import { LogOut } from 'lucide-react';
import { logoutAction } from './actions/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  const currentMonth = await getCurrentMonth();
  const monthsHistory = await getMonths();
  const view = (searchParams?.view as string) || 'monthly';

  if (!currentMonth && monthsHistory.length === 0) {
    // This should theoretically not happen anymore due to First Access logic
    // but we keep a fallback just in case the DB connection totally fails.
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-zinc-950 text-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Erro de Conexão</h2>
          <p className="text-zinc-400">
            Não foi possível carregar os dados financeiros ou o banco de dados está inacessível.
          </p>
        </div>
      </div>
    );
  }

  // Use the latest open month or the most recent one
  const paramMonthId = searchParams?.monthId as string | undefined;
  const activeMonth = paramMonthId
    ? monthsHistory.find((m) => m.id === paramMonthId) || currentMonth || monthsHistory[0]
    : currentMonth || monthsHistory[0];

  let transactions: any[] = [];
  let displayMonthBalance = { ...activeMonth };

  if (view === 'monthly') {
    transactions = await getTransactions(activeMonth.id);
  } else if (view === 'semiannual') {
    const currentIndex = monthsHistory.findIndex((m) => m.id === activeMonth.id);
    const targetMonths = monthsHistory.slice(currentIndex, currentIndex + 6);
    const monthIds = targetMonths.map((m) => m.id);
    
    // Fetch all transactions for these 6 months
    const allTxs = await Promise.all(monthIds.map(id => getTransactions(id)));
    transactions = allTxs.flat();

    // The oldest month in the slice is the initial balance baseline
    const oldestMonth = targetMonths[targetMonths.length - 1];
    displayMonthBalance.initialBalance = oldestMonth?.initialBalance || 0;
  } else if (view === 'annual') {
    const currentYear = activeMonth.year;
    const yearMonths = monthsHistory.filter((m) => m.year === currentYear);
    const monthIds = yearMonths.map((m) => m.id);

    const allTxs = await Promise.all(monthIds.map(id => getTransactions(id)));
    transactions = allTxs.flat();

    // Find January or the oldest month in the year for the baseline
    const oldestMonth = yearMonths[yearMonths.length - 1];
    displayMonthBalance.initialBalance = oldestMonth?.initialBalance || 0;
  }

  return (
    <div className="min-h-screen pb-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold">S</span>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Segue-me</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <form
              action={async () => {
                'use server';
                await logoutAction();
                redirect('/login');
              }}
            >
              <button
                type="submit"
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard Financeiro</h2>
            <p className="text-zinc-400 mt-1">
              Visão geral de {activeMonth.month.toString().padStart(2, '0')}/{activeMonth.year}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg w-full sm:w-auto">
              <a href={`/?view=monthly&monthId=${activeMonth.id}`} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}>Mensal</a>
              <a href={`/?view=semiannual&monthId=${activeMonth.id}`} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'semiannual' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}>Semestral</a>
              <a href={`/?view=annual&monthId=${activeMonth.id}`} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'annual' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}>Anual</a>
            </div>
            
            <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-zinc-700 pt-2 sm:pt-0 sm:pl-4">
              <MonthSelector monthsHistory={monthsHistory} activeMonthId={activeMonth.id} />
            </div>
          </div>
        </div>

        <DashboardStats monthBalance={displayMonthBalance} transactions={transactions} />
        
        <Charts monthsHistory={monthsHistory} transactions={transactions} view={view} />

        {view === 'monthly' ? (
          <TransactionTable transactions={transactions} monthClosed={activeMonth.isClosed} monthId={activeMonth.id} />
        ) : (
          <div className="mt-8 p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl text-center">
            <p className="text-zinc-400">Exibição detalhada de transações ocultada nas visões consolidadas.</p>
          </div>
        )}
      </main>
    </div>
  );
}
