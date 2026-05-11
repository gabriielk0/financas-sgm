import { Printer } from 'lucide-react';
import MonthSelector from '@/components/MonthSelector';
import { MonthBalance } from '@prisma/client';

export default function FinanceHeaderControls({
  activeMonth,
  monthsHistory,
  view,
  basePath,
}: {
  activeMonth: MonthBalance;
  monthsHistory: MonthBalance[];
  view: string;
  basePath: string;
}) {
  return (
    <div className="flex w-full flex-col items-stretch gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-2 lg:w-auto sm:flex-row sm:items-center">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950 p-1">
        {[
          ['monthly', 'Mensal'],
          ['semiannual', 'Semestral'],
          ['annual', 'Anual'],
        ].map(([value, label]) => (
          <a
            key={value}
            href={`${basePath}?view=${value}&monthId=${activeMonth.id}`}
            className={`rounded-md px-3 py-2 text-center text-sm font-medium transition ${
              view === value
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2 border-zinc-700 sm:border-l sm:pl-3">
        <MonthSelector
          monthsHistory={monthsHistory}
          activeMonthId={activeMonth.id}
        />
        <a
          href={`/financas/report?view=${view}&monthId=${activeMonth.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 p-2 text-white transition hover:bg-indigo-500 sm:px-3"
          title="Exportar PDF"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:ml-2 sm:inline">PDF</span>
        </a>
      </div>
    </div>
  );
}
