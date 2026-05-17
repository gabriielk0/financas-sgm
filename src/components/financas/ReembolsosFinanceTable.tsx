'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  CreditCard,
  History
} from 'lucide-react';
import { aprovarReembolso, rejeitarReembolso } from '@/app/actions/reembolsos';
import type { ReembolsoPendente } from '@/types/reembolso';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function whatsappUrl(whatsapp: string, nome: string, motivo: string) {
  const phone = whatsapp.replace(/\D/g, '');
  const text = encodeURIComponent(
    `Olá ${nome}, sua solicitação foi rejeitada. Motivo: ${motivo}`,
  );
  return `https://wa.me/${phone}?text=${text}`;
}

function statusBadge(status: string) {
  const styles = {
    pendente_reembolso: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
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
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[key] || 'border-zinc-700 bg-zinc-800 text-zinc-300'}`}>
      {labels[key] || status}
    </span>
  );
}

export default function ReembolsosFinanceTable({
  reembolsos,
}: {
  reembolsos: ReembolsoPendente[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReembolsoPendente | null>(null);
  const [motivo, setMotivo] = useState('');
  
  // Partial approval states
  const [isApproving, setIsApproving] = useState(false);
  const [valorAprovado, setValorAprovado] = useState<number | ''>('');
  const [justificativa, setJustificativa] = useState('');

  const [loadingAction, setLoadingAction] = useState('');
  const [error, setError] = useState('');
  const [whatsAppShortcut, setWhatsAppShortcut] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [equipeFilter, setEquipeFilter] = useState('');

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set('busca', search);
    if (statusFilter) params.set('status', statusFilter);
    if (equipeFilter) params.set('equipe', equipeFilter);
    router.push(`?${params.toString()}`);
  }

  async function handleApprove(reembolso: ReembolsoPendente) {
    setLoadingAction(`approve:${reembolso.id}`);
    setError('');

    const valToApprove = typeof valorAprovado === 'number' ? valorAprovado : undefined;
    const result = await aprovarReembolso(reembolso.id, valToApprove, justificativa);

    setLoadingAction('');

    if (!result.success) {
      setError(result.error || 'Não foi possível aprovar.');
      return;
    }

    setSelected(null);
    router.refresh();
  }

  async function handleReject() {
    if (!selected) return;

    setLoadingAction(`reject:${selected.id}`);
    setError('');

    const result = await rejeitarReembolso(selected.id, motivo);

    setLoadingAction('');

    if (!result.success) {
      setError(result.error || 'Não foi possível rejeitar.');
      return;
    }

    setWhatsAppShortcut(
      whatsappUrl(selected.usuario.whatsapp, selected.usuario.nome, motivo),
    );
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-zinc-400">Busca Textual</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Nome, descrição ou finalidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 pl-10 pr-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <label className="mb-1 block text-sm font-medium text-zinc-400">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="pendente_reembolso">Pendentes</option>
            <option value="aprovado">Aprovados</option>
            <option value="rejeitado">Rejeitados</option>
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label className="mb-1 block text-sm font-medium text-zinc-400">Equipe</label>
          <select
            value={equipeFilter}
            onChange={(e) => setEquipeFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todas</option>
            <option value="Comando">Comando</option>
            <option value="Prover">Prover</option>
            <option value="Fichas">Fichas</option>
            <option value="Pós-encontro">Pós-encontro</option>
            <option value="Montagem">Montagem</option>
            <option value="Palestras">Palestras</option>
          </select>
        </div>
        <button
          onClick={applyFilters}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtrar
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Solicitante</th>
                <th className="px-4 py-3 font-medium">Equipe</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {reembolsos.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Nenhum reembolso pendente.
                  </td>
                </tr>
              ) : (
                reembolsos.map((reembolso) => (
                  <tr
                    key={reembolso.id}
                    onClick={() => {
                      setSelected(reembolso);
                      setMotivo('');
                      setError('');
                      setWhatsAppShortcut('');
                      setIsApproving(false);
                      setValorAprovado(reembolso.valor);
                      setJustificativa('');
                    }}
                    className="cursor-pointer transition hover:bg-zinc-800/60"
                  >
                    <td className="px-4 py-4 text-sm text-zinc-100">
                      {reembolso.usuario.nome}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {reembolso.equipe}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {reembolso.descricao}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {formatCurrency(reembolso.valor)}
                    </td>
                    <td className="px-4 py-4">
                      {statusBadge(reembolso.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      {new Date(reembolso.criado_em).toLocaleDateString(
                        'pt-BR',
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {reembolso.status === 'pendente_reembolso' ? (
                          <>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelected(reembolso);
                                setIsApproving(true);
                                setValorAprovado(reembolso.valor);
                                setJustificativa('');
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500 hover:text-white"
                              title="Aprovar"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelected(reembolso);
                                setIsApproving(false);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 transition hover:bg-rose-500 hover:text-white"
                              title="Rejeitar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300 transition hover:bg-indigo-500 hover:text-white"
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-6 border-b border-zinc-800/50 pb-6 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold text-white">
                    {selected.descricao}
                  </h2>
                  {statusBadge(selected.status)}
                </div>
                <p className="text-base text-zinc-400">
                  Solicitado por <span className="font-medium text-zinc-300">{selected.usuario.nome}</span> ({selected.equipe})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white bg-zinc-950/50 border border-zinc-800"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 flex-1">
              {/* Coluna Esquerda: Detalhes e Comprovante */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Detalhes da Solicitação</h3>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-5 shadow-inner">
                    <div>
                      <strong className="block text-sm text-zinc-500 mb-1">Valor Solicitado</strong>
                      <span className="text-2xl font-semibold text-white">{formatCurrency(selected.valor)}</span>
                      {selected.valor_aprovado !== null && selected.valor_aprovado !== selected.valor && (
                        <p className="text-sm font-medium text-amber-400 mt-1 bg-amber-400/10 inline-block px-2 py-0.5 rounded">
                          Aprovado: {formatCurrency(selected.valor_aprovado)}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong className="block text-sm text-zinc-500 mb-1">Chave PIX</strong>
                        <span className="text-base text-zinc-300 break-all">{selected.chave_pix}</span>
                      </div>
                      <div>
                        <strong className="block text-sm text-zinc-500 mb-1">Data do Pedido</strong>
                        <span className="text-base text-zinc-300">{new Date(selected.criado_em).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    <div>
                      <strong className="block text-sm text-zinc-500 mb-1">Motivo / Finalidade</strong>
                      <span className="text-base text-zinc-300 block bg-zinc-900 rounded-lg p-3 border border-zinc-800/60 leading-relaxed">{selected.finalidade}</span>
                    </div>

                    <div>
                      <strong className="block text-sm text-zinc-500 mb-1">Contato</strong>
                      <a href={`https://wa.me/${selected.usuario.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-2 text-sm">
                        <MessageCircle className="w-4 h-4" /> {selected.usuario.whatsapp}
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Comprovante Anexo</h3>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-inner">
                    {selected.anexo_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || !selected.anexo_url.includes('.pdf') ? (
                      <a href={selected.anexo_url} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden rounded-lg border border-zinc-800 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selected.anexo_url} alt="Comprovante" className="w-full object-cover max-h-80 bg-zinc-900 transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Abrir Original</span>
                        </div>
                      </a>
                    ) : (
                      <a
                        href={selected.anexo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-indigo-400 transition hover:bg-zinc-800 hover:text-indigo-300"
                      >
                        <ExternalLink className="h-6 w-6" />
                        <span className="font-medium">Abrir Arquivo PDF Original</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Avaliação e Histórico */}
              <div className="space-y-6 flex flex-col">
              {isApproving ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
                  <h3 className="text-sm font-medium text-emerald-400 mb-3">Aprovação de Reembolso</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-zinc-300 mb-1 block">Valor Aprovado (R$)</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={valorAprovado}
                        onChange={e => setValorAprovado(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-zinc-300 mb-1 block">Justificativa (Se alterar valor)</span>
                      <input 
                        type="text" 
                        value={justificativa}
                        onChange={e => setJustificativa(e.target.value)}
                        placeholder="Opcional, obrigatório se alterar valor"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </label>
                  </div>
                  {valorAprovado !== selected.valor && !justificativa && (
                    <p className="mt-2 text-xs text-amber-400">A justificativa é necessária ao aprovar valor diferente do solicitado.</p>
                  )}
                </div>
              ) : selected.status === 'pendente_reembolso' ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 mb-4">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-300">
                      Motivo da rejeição (apenas se for rejeitar)
                    </span>
                    <textarea
                      value={motivo}
                      onChange={(event) => setMotivo(event.target.value)}
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                    />
                  </label>
                </div>
              ) : null}

              {/* Histórico Visual */}
              {selected.historico && selected.historico.length > 0 && (
                <div className="mt-2 mb-4 flex-1">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-400" /> Histórico da Solicitação
                  </h3>
                  <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-inner">
                    {selected.historico.map((hist, i: number) => (
                      <div key={hist.id} className="flex gap-4 text-sm relative">
                        {i !== selected.historico.length - 1 && (
                          <div className="absolute left-[9px] top-6 bottom-[-16px] w-px bg-zinc-800"></div>
                        )}
                        <div className="w-5 h-5 rounded-full border-2 bg-zinc-900 border-zinc-500 mt-0.5 shrink-0 z-10 flex items-center justify-center">
                          {hist.acao === 'PAGO' && <Check className="w-2.5 h-2.5 text-zinc-300" />}
                        </div>
                        <div className="pb-2">
                          <p className="font-semibold text-zinc-100 text-base">
                            {hist.acao} <span className="text-zinc-500 text-sm font-normal ml-2">{new Date(hist.criado_em).toLocaleString('pt-BR')}</span>
                          </p>
                          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{hist.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-sm text-rose-200 shadow-sm">
                  {error}
                </p>
              )}

              {whatsAppShortcut && (
                <a
                  href={whatsAppShortcut}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 shadow-md w-full sm:w-auto"
                >
                  <MessageCircle className="h-5 w-5" />
                  Avisar solicitante pelo WhatsApp
                </a>
              )}
            </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-zinc-800 pt-6 shrink-0 bg-zinc-900">
              {selected.lancamento_id && (
                <button
                  type="button"
                  onClick={() => router.push(`/financas/lancamentos?busca=${selected.descricao}`)}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-6 py-2.5 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-600 hover:text-white"
                >
                  <CreditCard className="w-5 h-5" />
                  Visualizar Lançamento Financeiro
                </button>
              )}
              
              {selected.status === 'pendente_reembolso' && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleReject()}
                    disabled={loadingAction === `reject:${selected.id}` || isApproving}
                    className="w-full sm:w-auto rounded-lg border border-rose-500/40 bg-rose-500/10 px-6 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-600 disabled:opacity-50"
                  >
                    {loadingAction === `reject:${selected.id}`
                      ? 'Rejeitando...'
                      : 'Rejeitar Pedido'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isApproving) {
                        setIsApproving(true);
                      } else {
                        if (valorAprovado !== selected.valor && !justificativa) {
                          setError('Justificativa obrigatória ao aprovar um valor diferente.');
                          return;
                        }
                        void handleApprove(selected);
                      }
                    }}
                    disabled={loadingAction === `approve:${selected.id}`}
                    className="w-full sm:w-auto rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 shadow-md"
                  >
                    {loadingAction === `approve:${selected.id}`
                      ? 'Aprovando...'
                      : isApproving ? 'Confirmar Aprovação' : 'Aprovar Pedido'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
