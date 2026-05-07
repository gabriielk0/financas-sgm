'use client';

import { ArrowDownIcon, ArrowUpIcon, DollarSign, Wallet } from 'lucide-react';

export default function DashboardStats({
  monthBalance,
  transactions,
}: {
  monthBalance: any;
  transactions: any[];
}) {
  const totalIn = transactions
    .filter((t) => t.type === 'IN' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === 'OUT' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const profit = totalIn - totalOut;
  const currentBalance = monthBalance.initialBalance + profit;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const stats = [
    {
      title: 'Entradas',
      amount: totalIn,
      icon: ArrowUpIcon,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
    {
      title: 'Saídas',
      amount: totalOut,
      icon: ArrowDownIcon,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
      border: 'border-rose-400/20',
    },
    {
      title: 'Lucro Líquido',
      amount: profit,
      icon: DollarSign,
      color: profit >= 0 ? 'text-indigo-400' : 'text-rose-400',
      bg: profit >= 0 ? 'bg-indigo-400/10' : 'bg-rose-400/10',
      border: profit >= 0 ? 'border-indigo-400/20' : 'border-rose-400/20',
    },
    {
      title: 'Saldo Atual',
      amount: currentBalance,
      icon: Wallet,
      color: 'text-zinc-50',
      bg: 'bg-zinc-800',
      border: 'border-zinc-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`p-6 rounded-2xl border ${stat.border} bg-zinc-900/50 backdrop-blur-sm flex flex-col gap-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
        >
          <div className="flex justify-between items-start">
            <h3 className="text-zinc-400 font-medium text-sm">{stat.title}</h3>
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
      ))}
    </div>
  );
}
