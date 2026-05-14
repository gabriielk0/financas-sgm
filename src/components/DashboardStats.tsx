'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { MonthBalance, Transaction } from '@prisma/client';

export default function DashboardStats({
  monthBalance,
  transactions,
}: {
  monthBalance: MonthBalance;
  transactions: Transaction[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('typeFilter');
  const [isExpanded, setIsExpanded] = useState(false);

  const totalIn = transactions
    .filter((t) => t.type === 'IN' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === 'OUT' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const profit = totalIn - totalOut;
  const currentBalance = monthBalance.initialBalance + profit;

  const pendingIn = transactions
    .filter((t) => t.type === 'IN' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingOut = transactions
    .filter((t) => t.type === 'OUT' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPending = pendingIn - pendingOut;
  const expectedBalance = currentBalance + totalPending;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const stats = [
    {
      title: 'Entradas',
      amount: totalIn,
      icon: ArrowUpIcon,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      id: 'IN',
    },
    {
      title: 'Saídas',
      amount: totalOut,
      icon: ArrowDownIcon,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
      border: 'border-rose-400/20',
      id: 'OUT',
    },
    {
      title: 'Lucro Líquido',
      amount: profit,
      icon: DollarSign,
      color: profit >= 0 ? 'text-indigo-400' : 'text-rose-400',
      bg: profit >= 0 ? 'bg-indigo-400/10' : 'bg-rose-400/10',
      border: profit >= 0 ? 'border-indigo-400/20' : 'border-rose-400/20',
      id: 'PROFIT',
    },
    {
      title: 'Saldo Atual',
      amount: currentBalance,
      icon: Wallet,
      color: 'text-zinc-50',
      bg: 'bg-zinc-800',
      border: 'border-zinc-700',
      id: 'BALANCE',
    },
  ];

  const handleStatClick = (id: string) => {
    if (id !== 'IN' && id !== 'OUT') return;

    const params = new URLSearchParams(searchParams.toString());

    if (currentFilter === id) {
      params.delete('typeFilter');
    } else {
      params.set('typeFilter', id);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Realizado */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Realizado (Concluído)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const isClickable = stat.id === 'IN' || stat.id === 'OUT';
            const isActive = currentFilter === stat.id;

            return (
              <div
                key={i}
                onClick={() => handleStatClick(stat.id || '')}
                className={`p-6 rounded-2xl border flex flex-col gap-4 shadow-lg transition-all duration-300 
                  ${isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : ''}
                  ${isActive ? `ring-2 ring-offset-2 ring-offset-zinc-950 ${stat.color.replace('text-', 'ring-')}` : stat.border}
                  bg-zinc-900/50 backdrop-blur-sm
                `}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-zinc-400 font-medium text-sm">
                    {stat.title}
                  </h3>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {formatCurrency(stat.amount)}
                  </h2>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhes e Previsões (Menu Expansível) */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden transition-all duration-300 mt-6">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <h2 className="text-lg font-semibold text-white">Informações Gerenciais e Previsão</h2>
            {!isExpanded && (
              <p className="text-sm text-zinc-400 mt-1">
                Clique para ver previsão futura e análise de maiores gastos.
              </p>
            )}
          </div>
          <button className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isExpanded && (
          <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
            
            {/* Cards Estratégicos Gerenciais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-zinc-800/50 pt-4">
              {(() => {
                const outTransactions = transactions.filter(t => t.type === 'OUT');
                if (outTransactions.length === 0) return null;

                const topExpense = outTransactions.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
                
                const expensesByArea = outTransactions.reduce((acc: Record<string, number>, t) => {
                  const area = t.area || 'Outros';
                  acc[area] = (acc[area] || 0) + t.amount;
                  return acc;
                }, {});
                
                const topArea = Object.entries(expensesByArea).sort((a, b) => b[1] - a[1])[0];

                return (
                  <>
                    <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-center shadow-sm">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Maior Despesa do Mês</span>
                      <p className="text-xl font-bold text-white">{formatCurrency(topExpense.amount)}</p>
                      <p className="text-sm text-zinc-400 mt-1 truncate" title={topExpense.description}>{topExpense.description}</p>
                    </div>
                    
                    {topArea && (
                      <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-center shadow-sm">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Equipe c/ Maior Gasto</span>
                        <p className="text-xl font-bold text-white">{topArea[0]}</p>
                        <p className="text-sm text-rose-400 mt-1">{formatCurrency(topArea[1])}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-800/50 pt-4">
              <div className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/50 backdrop-blur-sm shadow-lg flex flex-col justify-center">
                <h3 className="text-zinc-400 font-medium text-sm mb-2">Saldo Atual (Concluído)</h3>
                <h2 className="text-2xl font-bold text-white">{formatCurrency(currentBalance)}</h2>
              </div>
              <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm shadow-lg flex flex-col justify-center">
                <h3 className="text-amber-400 font-medium text-sm mb-2">Total Pendente (Entradas - Saídas)</h3>
                <h2 className={`text-2xl font-bold ${totalPending >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalPending >= 0 ? '+' : ''}{formatCurrency(totalPending)}
                </h2>
                <div className="text-xs text-zinc-500 mt-1">
                  +{formatCurrency(pendingIn)} / -{formatCurrency(pendingOut)}
                </div>
              </div>
              <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm shadow-lg flex flex-col justify-center">
                <h3 className="text-indigo-400 font-medium text-sm mb-2">Saldo Previsto Final</h3>
                <h2 className="text-2xl font-bold text-white">{formatCurrency(expectedBalance)}</h2>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
