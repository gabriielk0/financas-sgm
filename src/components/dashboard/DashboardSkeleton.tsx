export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8 mt-8">
      {/* Esqueleto dos 3 cards de estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-zinc-900/50 border border-zinc-800"
          />
        ))}
      </div>

      {/* Esqueleto da área do gráfico */}
      <div className="h-[400px] rounded-xl bg-zinc-900/50 border border-zinc-800" />
    </div>
  );
}
