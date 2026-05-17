export default function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 animate-pulse">
      <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="h-4 w-56 rounded bg-zinc-700/70" />
      </div>

      <div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex h-16 items-center justify-between border-b border-zinc-800/50 px-6"
          >
            <div className="flex items-center gap-6">
              <div className="h-4 w-24 rounded bg-zinc-700/70" />
              <div className="h-4 w-52 rounded bg-zinc-700/60" />
              <div className="h-8 w-20 rounded-lg bg-zinc-800" />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-zinc-800" />
              <div className="h-8 w-20 rounded-lg bg-zinc-700/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
