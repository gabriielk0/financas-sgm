'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  XCircle,
} from 'lucide-react';
import { aprovarReembolso, rejeitarReembolso } from '@/app/actions/reembolsos';
import type { ReembolsoPendente } from '@/types/reembolso';
import { formatDateUTC } from '@/lib/date-utils';

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

export default function ReembolsosFinanceTable({
  reembolsos,
}: {
  reembolsos: ReembolsoPendente[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReembolsoPendente | null>(null);
  const [motivo, setMotivo] = useState('');
  const [loadingAction, setLoadingAction] = useState('');
  const [error, setError] = useState('');
  const [whatsAppShortcut, setWhatsAppShortcut] = useState('');

  async function handleApprove(reembolso: ReembolsoPendente) {
    setLoadingAction(`approve:${reembolso.id}`);
    setError('');

    const result = await aprovarReembolso(reembolso.id);

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
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Solicitante</th>
                <th className="px-4 py-3 font-medium">Equipe</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Chave PIX</th>
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
                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {reembolso.chave_pix}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      {formatDateUTC(reembolso.criado_em)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleApprove(reembolso);
                          }}
                          disabled={loadingAction === `approve:${reembolso.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                          title="Aprovar"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(reembolso);
                            setMotivo('');
                            setError('');
                            setWhatsAppShortcut('');
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 transition hover:bg-rose-500 hover:text-white"
                          title="Rejeitar"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {selected.descricao}
                </h2>
                <div className="mt-3 rounded-md border border-indigo-500/20 bg-indigo-500/10 p-3 text-base font-medium text-indigo-300">
                  <strong className="text-indigo-200">
                    Motivo/Finalidade:
                  </strong>{' '}
                  {selected.finalidade}
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {selected.usuario.nome} · {selected.equipe} ·{' '}
                  {formatCurrency(selected.valor)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="Chave PIX" value={selected.chave_pix} />
              <Detail label="WhatsApp" value={selected.usuario.whatsapp} />
              <Detail
                label="Data"
                value={formatDateUTC(selected.criado_em)}
              />
            </div>

            <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm font-medium text-white">Anexo</p>
              <a
                href={selected.anexo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
              >
                Abrir comprovante
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-300">
                  Motivo da rejeição
                </span>
                <textarea
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </label>

              {error && (
                <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              )}

              {whatsAppShortcut && (
                <a
                  href={whatsAppShortcut}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  Avisar pelo WhatsApp
                </a>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={loadingAction === `reject:${selected.id}`}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-600 disabled:opacity-50"
              >
                {loadingAction === `reject:${selected.id}`
                  ? 'Rejeitando...'
                  : 'Rejeitar'}
              </button>
              <button
                type="button"
                onClick={() => void handleApprove(selected)}
                disabled={loadingAction === `approve:${selected.id}`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {loadingAction === `approve:${selected.id}`
                  ? 'Aprovando...'
                  : 'Aprovar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-100">{value}</p>
    </div>
  );
}
