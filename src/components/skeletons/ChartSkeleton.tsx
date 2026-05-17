export default function ChartSkeleton() {
  const bars = [35, 52, 24, 68, 44, 58, 30, 74, 40, 62, 28, 55];

  return (
    <div className="h-[400px] rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 animate-pulse">
      <div className="mb-6 h-4 w-40 rounded bg-zinc-700/70" />

      <div className="flex h-[320px] items-end gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 pb-4 pt-6">
        {bars.map((height, index) => (
          <div key={index} className="flex-1">
            <div
              className="w-full rounded-sm bg-zinc-700/70"
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
