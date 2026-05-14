import Link from 'next/link';
import { Check } from 'lucide-react';
import PrivateRoute from '@/components/PrivateRoute';
import ReembolsoTopbar from '@/components/reembolso/ReembolsoTopbar';
import { listarMinhasSolicitacoes } from '@/app/actions/reembolsos';

export const dynamic = 'force-dynamic';

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
                        {new Date(item.criado_em).toLocaleDateString('pt-BR')} ·{' '}
                        {item.equipe}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(item.valor)}
                      </p>
                      {item.valor_aprovado !== null && item.valor_aprovado !== item.valor && (
                        <p className="mt-1 text-sm font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded inline-block">
                          Aprovado: {formatCurrency(item.valor_aprovado)}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.status === 'rejeitado' && item.motivo_rejeicao && (
                    <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                      <strong className="text-rose-200">Motivo:</strong>{' '}
                      {item.motivo_rejeicao}
                    </div>
                  )}

                  {/* TIMELINE AQUI */}
                  {item.historico && item.historico.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-zinc-800/50">
                      <h3 className="text-sm font-medium text-zinc-300 mb-4">Acompanhamento</h3>
                      <div className="space-y-4">
                        {item.historico.map((hist: any, index: number) => (
                          <div key={hist.id} className="flex gap-4 relative">
                            {/* Linha conectora */}
                            {index !== item.historico.length - 1 && (
                              <div className="absolute left-[11px] top-7 bottom-[-16px] w-0.5 bg-zinc-800"></div>
                            )}
                            <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0 border-2 bg-zinc-900 z-10 ${
                              hist.acao === 'CRIADO' ? 'border-zinc-500' :
                              hist.acao === 'APROVADO' ? 'border-emerald-500' :
                              hist.acao === 'PAGO' ? 'border-indigo-500 bg-indigo-500' :
                              hist.acao === 'REJEITADO' ? 'border-rose-500' :
                              hist.acao === 'VALOR_ALTERADO' ? 'border-amber-500' :
                              'border-zinc-600'
                            }`}>
                              {hist.acao === 'PAGO' && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-200">
                                  {hist.acao === 'CRIADO' ? 'Solicitação Enviada' :
                                  hist.acao === 'APROVADO' ? 'Aprovado' :
                                  hist.acao === 'PAGO' ? 'Pago' :
                                  hist.acao === 'REJEITADO' ? 'Rejeitado' :
                                  hist.acao === 'VALOR_ALTERADO' ? 'Valor Alterado' : hist.acao}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {new Date(hist.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-400 mt-1">{hist.descricao}</p>
                            </div>
                          </div>
                        ))}
                      </div>
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
