'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { MonthBalance, Transaction } from '@prisma/client';

const COLORS = ['#34d399', '#fb7185']; // emerald-400 e rose-400

export default function Charts({
  monthsHistory,
  transactions,
  view = 'monthly',
}: {
  monthsHistory: MonthBalance[];
  transactions: Transaction[];
  view?: string;
}) {
  // Dados do gráfico de linha
  const lineData = monthsHistory
    .slice()
    .reverse()
    .map((m) => {
      const monthName = new Date(m.year, m.month - 1).toLocaleString('pt-BR', {
        month: 'short',
        year: '2-digit',
      });
      return {
        name: monthName,
        Saldo: m.finalBalance,
      };
    });

  // Dados do gráfico de pizza
  const totalIn = transactions
    .filter((t) => t.type === 'IN' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === 'OUT' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const pieData = [
    { name: 'Entradas', value: totalIn },
    { name: 'Saídas', value: totalOut },
  ];

  // Dados por equipe (apenas saídas concluídas)
  const expensesByArea = transactions
    .filter((t) => t.type === 'OUT' && t.status === 'COMPLETED')
    .reduce((acc: Record<string, number>, t) => {
      const area = t.area || 'Outros';
      acc[area] = (acc[area] || 0) + t.amount;
      return acc;
    }, {});

  const pieDataByTeam = Object.entries(expensesByArea)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5 equipes para não poluir o gráfico
    
  // Adiciona a categoria 'Outros' se houver mais que 5
  const otherExpenses = Object.entries(expensesByArea)
    .sort((a, b) => b[1] - a[1])
    .slice(5)
    .reduce((acc, [, val]) => acc + val, 0);
    
  if (otherExpenses > 0) {
    pieDataByTeam.push({ name: 'Outras Áreas', value: otherExpenses });
  }

  // Mais cores para as equipes no gráfico de pizza
  const TEAM_COLORS = [
    '#6366f1', // indigo-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#64748b'  // slate-500
  ];

  // Dados do gráfico de barras (para visão anual)
  const barData =
    view === 'annual'
      ? Object.values(
          transactions.reduce<Record<string, { name: string; Entradas: number; Saídas: number }>>((acc, t) => {
      const monthKey = new Date(t.date).toLocaleString('pt-BR', { month: 'short' });
      if (!acc[monthKey]) acc[monthKey] = { name: monthKey, Entradas: 0, Saídas: 0 };
      if (t.type === 'IN' && t.status === 'COMPLETED') acc[monthKey].Entradas += t.amount;
      if (t.type === 'OUT' && t.status === 'COMPLETED') acc[monthKey].Saídas += t.amount;
      return acc;
          }, {}),
        ).reverse()
      : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
      {/* Gráfico de linha */}
      <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6">Evolução do Saldo</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="Saldo"
                stroke="#818cf8" // indigo-400
                strokeWidth={3}
                dot={{ fill: '#818cf8', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos Secundários */}
      {view === 'annual' ? (
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">Comparativo Mensal</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {totalIn === 0 && totalOut === 0 ? (
              <p className="text-zinc-500 text-sm">Sem dados para este período.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                    formatter={(value) => `R$ ${Number(Array.isArray(value) ? value[0] : (value ?? 0)).toFixed(2)}`}
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Bar dataKey="Entradas" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saídas" fill="#fb7185" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6">Entradas x Saídas</h3>
            <div className="h-72 w-full flex items-center justify-center">
              {totalIn === 0 && totalOut === 0 ? (
                <p className="text-zinc-500 text-sm">Sem dados para este período.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `R$ ${Number(Array.isArray(value) ? value[0] : (value ?? 0)).toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40} 
                      iconType="circle" 
                      formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6">Despesas por Equipe</h3>
            <div className="h-72 w-full flex items-center justify-center">
              {totalOut === 0 ? (
                <p className="text-zinc-500 text-sm">Sem saídas neste período.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataByTeam}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieDataByTeam.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TEAM_COLORS[index % TEAM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `R$ ${Number(Array.isArray(value) ? value[0] : (value ?? 0)).toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40} 
                      iconType="circle" 
                      formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
