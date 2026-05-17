export default function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-32 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 animate-pulse"
        >
          <div className="h-3 w-24 rounded bg-zinc-700/70" />
          <div className="mt-6 h-8 w-40 rounded bg-zinc-700/80" />
          <div className="mt-4 h-2 w-20 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
