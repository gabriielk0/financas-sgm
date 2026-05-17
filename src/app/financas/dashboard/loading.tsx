import CardsSkeleton from '@/components/skeletons/CardsSkeleton';
import ChartSkeleton from '@/components/skeletons/ChartSkeleton';

export default function LoadingDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-52 animate-pulse rounded bg-zinc-800" />
      </div>
      <CardsSkeleton />
      <div className="mt-8">
        <ChartSkeleton />
      </div>
    </main>
  );
}
