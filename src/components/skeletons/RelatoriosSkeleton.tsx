export default function RelatoriosSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-10 w-32 rounded-lg border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>

      <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="h-full w-full rounded-lg border border-zinc-800 bg-zinc-900" />
      </div>

      <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="h-full w-full rounded-lg border border-zinc-800 bg-zinc-900" />
      </div>
    </div>
  );
}
