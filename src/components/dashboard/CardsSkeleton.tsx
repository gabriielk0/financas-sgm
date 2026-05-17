export function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl bg-zinc-900/50 border border-zinc-800"
        />
      ))}
    </div>
  );
}

// src/components/dashboard/TableSkeleton.tsx
export function TableSkeleton() {
  return (
    <div className="h-[400px] w-full animate-pulse rounded-xl bg-zinc-900/50 border border-zinc-800" />
  );
}
