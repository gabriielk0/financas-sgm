import FinanceShell from '@/components/financas/FinanceShell';
import TableSkeleton from '@/components/skeletons/TableSkeleton';

export default function PagamentosLoading() {
  return (
    <FinanceShell pendingReimbursements={0}>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-64 rounded bg-zinc-800 mb-2" />
          <div className="h-4 w-80 rounded bg-zinc-800" />
        </div>

        <TableSkeleton />
      </main>
    </FinanceShell>
  );
}
