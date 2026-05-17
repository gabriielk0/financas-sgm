import CardsSkeleton from '@/components/skeletons/CardsSkeleton';
import TableSkeleton from '@/components/skeletons/TableSkeleton';

export default function LoadingLancamentosPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-8 w-52 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-zinc-800" />
      </div>
      <CardsSkeleton />
      <div className="mt-8">
        <TableSkeleton />
      </div>
    </main>
  );
}
