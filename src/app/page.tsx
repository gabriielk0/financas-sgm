import { getCurrentMonth, getMonths, getTransactions } from './actions/finance';
import DashboardStats from '@/components/DashboardStats';
import Charts from '@/components/Charts';
import TransactionTable from '@/components/TransactionTable';
import MonthSelector from '@/components/MonthSelector';
import { LogOut, Printer } from 'lucide-react';
import { logoutAction } from './actions/auth';
import { redirect } from 'next/navigation';
import { MonthBalance, Transaction } from '@prisma/client';

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
    // Teoricamente isso não deve mais acontecer por causa da lógica de primeiro acesso,
    // mas mantemos um fallback caso a conexão com o banco falhe totalmente.
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

  // Usar o último mês aberto ou o mais recente
  const paramMonthId = searchParams?.monthId as string | undefined;
  const activeMonth = paramMonthId
    ? monthsHistory.find((m) => m.id === paramMonthId) || currentMonth || monthsHistory[0]
    : currentMonth || monthsHistory[0];

  if (!activeMonth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-zinc-950 text-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Dados indisponíveis</h2>
          <p className="text-zinc-400">
            Não foi possível determinar o mês ativo no momento. Tente novamente em instantes.
          </p>
        </div>
      </div>
    );
  }

  let transactions: Transaction[] = [];
  const displayMonthBalance: MonthBalance = { ...activeMonth };

  if (view === 'monthly') {
    transactions = await getTransactions(activeMonth.id);
  } else if (view === 'semiannual') {
    const currentIndex = monthsHistory.findIndex((m) => m.id === activeMonth.id);
    const targetMonths = monthsHistory.slice(currentIndex, currentIndex + 6);
    const monthIds = targetMonths.map((m) => m.id);
    
    // Buscar todas as transações desses 6 meses
    const allTxs = await Promise.all(monthIds.map(id => getTransactions(id)));
    transactions = allTxs.flat();

    // O mês mais antigo do recorte é a base para o saldo inicial
    const oldestMonth = targetMonths[targetMonths.length - 1];
    displayMonthBalance.initialBalance = oldestMonth?.initialBalance || 0;
  } else if (view === 'annual') {
    const currentYear = activeMonth.year;
    const yearMonths = monthsHistory.filter((m) => m.year === currentYear);
    const monthIds = yearMonths.map((m) => m.id);

    const allTxs = await Promise.all(monthIds.map(id => getTransactions(id)));
    transactions = allTxs.flat();

    // Encontrar janeiro ou o mês mais antigo do ano para a base
    const oldestMonth = yearMonths[yearMonths.length - 1];
    displayMonthBalance.initialBalance = oldestMonth?.initialBalance || 0;
  }

  return (
    <div className="min-h-screen pb-12 relative overflow-hidden">
      {/* Elementos de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Cabeçalho */}
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

      {/* Conteúdo principal */}
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
            
            <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-zinc-700 pt-2 sm:pt-0 sm:pl-4 flex gap-2 items-center">
              <MonthSelector monthsHistory={monthsHistory} activeMonthId={activeMonth.id} />
              
              <a 
                href={`/report?view=${view}&monthId=${activeMonth.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 sm:px-4 sm:py-2 rounded-xl text-sm font-medium transition-all shadow-md"
                title="Exportar PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </a>
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
