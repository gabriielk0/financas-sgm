import TableSkeleton from '@/components/skeletons/TableSkeleton';

export default function LoadingUsuariosPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-8 w-60 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-zinc-800" />
      </div>
      <TableSkeleton />
    </main>
  );
}
