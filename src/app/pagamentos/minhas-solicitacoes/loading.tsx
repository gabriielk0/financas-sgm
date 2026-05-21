import ReembolsoTopbar from '@/components/pagamentos/ReembolsoTopbar';

export default function MinhasSolicitacoesLoading() {
  return (
    <div>
      <ReembolsoTopbar />
      <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-50">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center animate-pulse">
            <div>
              <div className="h-8 w-48 rounded bg-zinc-800 mb-2" />
              <div className="h-4 w-64 rounded bg-zinc-800" />
            </div>
            <div className="h-10 w-36 rounded bg-zinc-800" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 animate-pulse"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-16 rounded bg-zinc-800" />
                      <div className="h-6 w-48 rounded bg-zinc-800" />
                      <div className="h-5 w-20 rounded bg-zinc-800" />
                    </div>
                    <div className="h-4 w-64 rounded bg-zinc-800/70" />
                  </div>
                  <div className="h-6 w-20 rounded bg-zinc-800 align-self-start sm:align-self-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
