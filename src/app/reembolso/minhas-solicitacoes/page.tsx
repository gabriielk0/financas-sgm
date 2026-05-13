import Link from 'next/link';
import PrivateRoute from '@/components/PrivateRoute';
import ReembolsoTopbar from '@/components/reembolso/ReembolsoTopbar';
import { listarMinhasSolicitacoes } from '@/app/actions/reembolsos';
import { formatDateUTC } from '@/lib/date-utils';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function statusBadge(status: string) {
  const styles = {
    pendente_reembolso:
      'border-amber-500/30 bg-amber-500/10 text-amber-200',
    aprovado: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    rejeitado: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  } as const;

  const labels = {
    pendente_reembolso: 'Pendente',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
  } as const;

  const key = status as keyof typeof styles;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[key] || 'border-zinc-700 bg-zinc-800 text-zinc-300'
      }`}
    >
      {labels[key] || status}
    </span>
  );
}

export default async function MinhasSolicitacoesPage() {
  const solicitacoes = await listarMinhasSolicitacoes();

  return (
    <PrivateRoute modulo="reembolso">
      <ReembolsoTopbar />
      <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-50">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Minhas Solicitações
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Acompanhe o andamento dos seus pedidos de reembolso.
              </p>
            </div>
            <Link
              href="/reembolso/solicitar"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Criar nova solicitação
            </Link>
          </div>

          <div className="space-y-3">
            {solicitacoes.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
                Nenhuma solicitação enviada até agora.
              </div>
            ) : (
              solicitacoes.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-white">
                          {item.descricao}
                        </h2>
                        {statusBadge(item.status)}
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">
                        {formatDateUTC(item.criado_em)} ·{' '}
                        {item.equipe}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(item.valor)}
                    </p>
                  </div>

                  {item.status === 'rejeitado' && item.motivo_rejeicao && (
                    <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                      <strong className="text-rose-200">Motivo:</strong>{' '}
                      {item.motivo_rejeicao}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </main>
    </PrivateRoute>
  );
}
