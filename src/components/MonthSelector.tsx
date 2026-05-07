'use client';

import { useRouter } from 'next/navigation';

export default function MonthSelector({
  monthsHistory,
  activeMonthId,
}: {
  monthsHistory: any[];
  activeMonthId: string;
}) {
  const router = useRouter();

  return (
    <select
      value={activeMonthId}
      onChange={(e) => {
        router.push(`/?monthId=${e.target.value}`);
      }}
      className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
    >
      {monthsHistory.map((m) => (
        <option key={m.id} value={m.id}>
          {m.month.toString().padStart(2, '0')}/{m.year} {m.isClosed ? '(Fechado)' : '(Atual)'}
        </option>
      ))}
    </select>
  );
}
