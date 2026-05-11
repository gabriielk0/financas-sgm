'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MonthBalance } from '@prisma/client';

export default function MonthSelector({
  monthsHistory,
  activeMonthId,
}: {
  monthsHistory: MonthBalance[];
  activeMonthId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={activeMonthId}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('monthId', e.target.value);
        router.push(`${pathname}?${params.toString()}`);
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
