'use client';

import dynamic from 'next/dynamic';
import type { MonthBalance, Transaction } from '@prisma/client';
import ChartSkeleton from '@/components/skeletons/ChartSkeleton';

const Charts = dynamic(() => import('@/components/Charts'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export default function LazyCharts({
  monthsHistory,
  transactions,
  view,
}: {
  monthsHistory: MonthBalance[];
  transactions: Transaction[];
  view?: string;
}) {
  return (
    <Charts monthsHistory={monthsHistory} transactions={transactions} view={view} />
  );
}
