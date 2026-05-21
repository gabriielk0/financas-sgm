import FinanceShell from '@/components/financas/FinanceShell';
import CardsSkeleton from '@/components/skeletons/CardsSkeleton';
import ChartSkeleton from '@/components/skeletons/ChartSkeleton';

export default function DashboardLoading() {
  return (
    <FinanceShell pendingReimbursements={0}>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center animate-pulse">
          <div>
            <div className="h-8 w-48 rounded bg-zinc-800 mb-2" />
            <div className="h-4 w-32 rounded bg-zinc-800" />
          </div>
          <div className="h-10 w-64 rounded bg-zinc-800" />
        </div>
        
        <CardsSkeleton />
        
        <div className="mt-8">
          <ChartSkeleton />
        </div>
      </main>
    </FinanceShell>
  );
}
