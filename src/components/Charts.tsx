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

const COLORS = ['#34d399', '#fb7185']; // emerald-400 and rose-400

export default function Charts({
  monthsHistory,
  transactions,
  view = 'monthly',
}: {
  monthsHistory: any[];
  transactions: any[];
  view?: string;
}) {
  // Line Chart Data
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

  // Pie Chart Data
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

  // Bar Chart Data (For Annual View)
  const barData = view === 'annual' ? Object.values(
    transactions.reduce((acc, t) => {
      const monthKey = new Date(t.date).toLocaleString('pt-BR', { month: 'short' });
      if (!acc[monthKey]) acc[monthKey] = { name: monthKey, Entradas: 0, Saídas: 0 };
      if (t.type === 'IN' && t.status === 'COMPLETED') acc[monthKey].Entradas += t.amount;
      if (t.type === 'OUT' && t.status === 'COMPLETED') acc[monthKey].Saídas += t.amount;
      return acc;
    }, {})
  ).reverse() : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
      {/* Line Chart */}
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

      {/* Pie or Bar Chart */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6">
          {view === 'annual' ? 'Comparativo Mensal' : 'Distribuição Mensal'}
        </h3>
        <div className="h-72 w-full flex items-center justify-center">
          {totalIn === 0 && totalOut === 0 ? (
            <p className="text-zinc-500 text-sm">Sem dados para este período.</p>
          ) : view === 'annual' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData as any[]} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="Entradas" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-zinc-300 text-sm">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
