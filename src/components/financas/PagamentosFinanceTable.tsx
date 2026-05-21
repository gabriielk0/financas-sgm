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
  History,
  ReceiptText,
  FileText,
  Building2
} from 'lucide-react';
import { aprovarReembolso, rejeitarReembolso } from '@/app/actions/reembolsos';
import { aprovarPagamento, rejeitarPagamento, validarNotaFiscal } from '@/app/actions/pagamentos';
import type { SolicitacaoFinanceiro } from '@/types/reembolso';

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
    pendente_aprovacao: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    aprovado: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    rejeitado: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    pago: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    nf_enviada: 'border-purple-500/30 bg-purple-500/10 text-purple-200',
    concluido: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  } as const;

  const labels = {
    pendente_reembolso: 'Pendente',
    pendente_aprovacao: 'Pendente',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
    pago: 'Aguard. NF',
    nf_enviada: 'NF Enviada',
    concluido: 'Concluído',
  } as const;

  const key = status as keyof typeof styles;

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[key] || 'border-zinc-700 bg-zinc-800 text-zinc-300'}`}>
      {labels[key] || status}
    </span>
  );
}

export default function PagamentosFinanceTable({
  solicitacoes,
}: {
  solicitacoes: SolicitacaoFinanceiro[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<SolicitacaoFinanceiro | null>(null);
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
  const [tipoFilter, setTipoFilter] = useState<'todas' | 'reembolso' | 'orcamento'>('todas');

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set('busca', search);
    if (statusFilter) params.set('status', statusFilter);
    if (equipeFilter) params.set('equipe', equipeFilter);
    router.push(`?${params.toString()}`);
  }

  async function handleApprove(solicitacao: SolicitacaoFinanceiro) {
    setLoadingAction(`approve:${solicitacao.id}`);
    setError('');

    const valToApprove = typeof valorAprovado === 'number' ? valorAprovado : undefined;

    let result;
    if (solicitacao.tipo === 'reembolso') {
      result = await aprovarReembolso(solicitacao.id, valToApprove, justificativa);
    } else {
      result = await aprovarPagamento(solicitacao.id, valToApprove, justificativa);
    }

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

    let result;
    if (selected.tipo === 'reembolso') {
      result = await rejeitarReembolso(selected.id, motivo);
    } else {
      result = await rejeitarPagamento(selected.id, motivo);
    }

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

  const solicitacoesFiltradas = solicitacoes.filter(s => {
    if (tipoFilter === 'todas') return true;
    return s.tipo === tipoFilter;
  });

  const paymentDetails = (() => {
    if (selected && selected.tipo === 'orcamento' && selected.observacoes) {
      try {
        return JSON.parse(selected.observacoes);
      } catch (e) {
        return null;
      }
    }
    return null;
  })();

  return (
    <div>
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

        <div className="flex overflow-x-auto whitespace-nowrap bg-zinc-800/50 rounded-lg p-1 border border-zinc-700 h-[42px] scrollbar-hide">
          <button
            onClick={() => setTipoFilter('todas')}
            className={`px-4 text-sm font-medium rounded-md transition ${tipoFilter === 'todas' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setTipoFilter('reembolso')}
            className={`px-4 text-sm font-medium rounded-md transition ${tipoFilter === 'reembolso' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Reembolsos
          </button>
          <button
            onClick={() => setTipoFilter('orcamento')}
            className={`px-4 text-sm font-medium rounded-md transition ${tipoFilter === 'orcamento' ? 'bg-blue-500/20 text-blue-300 shadow-sm border border-blue-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Orçamentos
          </button>
        </div>

        <div className="w-full sm:w-48">
          <label className="mb-1 block text-sm font-medium text-zinc-400">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none h-[42px]"
          >
            <option value="">Todos</option>
            <option value="pendente_reembolso">Pendentes</option>
            <option value="aprovado">Aprovados</option>
            <option value="rejeitado">Rejeitados</option>
            <option value="pago">Aguardando NF</option>
            <option value="nf_enviada">NF Enviada</option>
            <option value="concluido">Concluídos</option>
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label className="mb-1 block text-sm font-medium text-zinc-400">Equipe</label>
          <select
            value={equipeFilter}
            onChange={(e) => setEquipeFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none h-[42px]"
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
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition flex items-center gap-2 h-[42px]"
        >
          <Filter className="w-4 h-4" />
          Filtrar
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tipo</th>
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
              {solicitacoesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                solicitacoesFiltradas.map((solicitacao) => (
                  <tr
                    key={solicitacao.id}
                    onClick={() => {
                      setSelected(solicitacao);
                      setMotivo('');
                      setError('');
                      setWhatsAppShortcut('');
                      setIsApproving(false);
                      setValorAprovado(solicitacao.valor);
                      setJustificativa('');
                    }}
                    className="cursor-pointer transition hover:bg-zinc-800/60"
                  >
                    <td className="px-4 py-4 text-sm">
                      {solicitacao.tipo === 'reembolso' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
                          <ReceiptText className="w-3.5 h-3.5" /> Reembolso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300">
                          <FileText className="w-3.5 h-3.5" /> Orçamento
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-100 max-w-[120px] sm:max-w-none truncate" title={solicitacao.usuario.nome}>
                      {solicitacao.usuario.nome}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300 max-w-[100px] sm:max-w-none truncate" title={solicitacao.equipe}>
                      {solicitacao.equipe}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300 max-w-[200px] truncate" title={solicitacao.descricao}>
                      {solicitacao.descricao}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {formatCurrency(solicitacao.valor)}
                    </td>
                    <td className="px-4 py-4">
                      {statusBadge(solicitacao.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      {new Date(solicitacao.criado_em).toLocaleDateString(
                        'pt-BR',
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {solicitacao.status === 'pendente_reembolso' || solicitacao.status === 'pendente_aprovacao' ? (
                          <>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelected(solicitacao);
                                setIsApproving(true);
                                setValorAprovado(solicitacao.valor);
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
                                setSelected(solicitacao);
                                setIsApproving(false);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 transition hover:bg-rose-500 hover:text-white"
                              title="Rejeitar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            {solicitacao.tipo === 'orcamento' && (solicitacao.status === 'nf_enviada' || solicitacao.status === 'concluido') && solicitacao.anexo_nf_url && (
                              <a
                                href={solicitacao.anexo_nf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 text-xs font-semibold text-purple-300 transition hover:bg-purple-500 hover:text-white"
                                title="Visualizar Nota Fiscal"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Ver NF</span>
                              </a>
                            )}
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300 transition hover:bg-indigo-500 hover:text-white"
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4">
          <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4 md:p-8 shadow-2xl flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-4 md:mb-6 border-b border-zinc-800/50 pb-4 md:pb-6 shrink-0">
              <div className="min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-white break-words">
                    {selected.descricao}
                  </h2>
                  <div className="shrink-0">{statusBadge(selected.status)}</div>
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
                        {selected.valor_aprovado !== null && selected.valor_aprovado !== undefined && selected.valor_aprovado !== selected.valor && (
                          <p className="text-sm font-medium text-amber-400 mt-1 bg-amber-400/10 inline-block px-2 py-0.5 rounded">
                            Aprovado: {formatCurrency(selected.valor_aprovado)}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selected.tipo === 'reembolso' ? (
                          <div className="min-w-0">
                            <strong className="block text-sm text-zinc-500 mb-1">Chave PIX</strong>
                            <span className="text-base text-zinc-300 break-words">{selected.chave_pix}</span>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <strong className="block text-sm text-zinc-500 mb-1">Fornecedor</strong>
                            <span className="text-base text-zinc-300 break-words flex items-center gap-2">
                              <Building2 className="w-4 h-4 shrink-0 text-zinc-500" />
                              <span className="truncate" title={selected.fornecedor || ''}>{selected.fornecedor}</span>
                            </span>
                          </div>
                        )}

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

                  {selected.tipo === 'orcamento' && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Forma de Pagamento</h3>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-inner">
                        {paymentDetails && paymentDetails.metodo_pagamento ? (
                          <>
                            <div>
                              <strong className="block text-sm text-zinc-500 mb-1">Método Escolhido</strong>
                              <span className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 uppercase">
                                {paymentDetails.metodo_pagamento === 'pix' ? 'PIX' :
                                 paymentDetails.metodo_pagamento === 'transferencia' ? 'Transferência / Depósito' :
                                 paymentDetails.metodo_pagamento === 'boleto' ? 'Boleto' : paymentDetails.metodo_pagamento}
                              </span>
                            </div>

                             {paymentDetails.metodo_pagamento === 'pix' && (
                              <div className="space-y-3">
                                <div>
                                  <strong className="block text-sm text-zinc-500 mb-1">Chave PIX</strong>
                                  <span className="text-base text-white font-mono break-all bg-zinc-900 rounded-lg p-2.5 border border-zinc-800/60 block select-all">
                                    {paymentDetails.chave_pix}
                                  </span>
                                </div>
                                {(paymentDetails.pix_nome || paymentDetails.pix_banco) && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/60">
                                    {paymentDetails.pix_nome && (
                                      <div>
                                        <strong className="block text-xs text-zinc-500 mb-0.5">Nome do Titular</strong>
                                        <span className="text-sm font-semibold text-white break-words">{paymentDetails.pix_nome}</span>
                                      </div>
                                    )}
                                    {paymentDetails.pix_banco && (
                                      <div>
                                        <strong className="block text-xs text-zinc-500 mb-0.5">Banco / Instituição</strong>
                                        <span className="text-sm font-semibold text-white break-words">{paymentDetails.pix_banco}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {paymentDetails.metodo_pagamento === 'transferencia' && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="min-w-0">
                                  <strong className="block text-sm text-zinc-500 mb-0.5">Banco</strong>
                                  <span className="text-sm font-semibold text-white break-words">{paymentDetails.banco}</span>
                                </div>
                                <div className="min-w-0">
                                  <strong className="block text-sm text-zinc-500 mb-0.5">Agência</strong>
                                  <span className="text-sm font-semibold text-white break-words">{paymentDetails.agencia}</span>
                                </div>
                                <div className="min-w-0">
                                  <strong className="block text-sm text-zinc-500 mb-0.5">Conta</strong>
                                  <span className="text-sm font-semibold text-white break-words">{paymentDetails.conta}</span>
                                </div>
                                {paymentDetails.cpf_cnpj && (
                                  <div className="sm:col-span-3 min-w-0">
                                    <strong className="block text-sm text-zinc-500 mb-0.5">CPF/CNPJ do Titular</strong>
                                    <span className="text-sm font-semibold text-white break-words">{paymentDetails.cpf_cnpj}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {paymentDetails.metodo_pagamento === 'boleto' && (
                              <div className="space-y-3">
                                {paymentDetails.codigo_barras && (
                                  <div>
                                    <strong className="block text-sm text-zinc-500 mb-1">Código de Barras</strong>
                                    <span className="text-xs text-white font-mono break-all bg-zinc-900 rounded-lg p-2.5 border border-zinc-800/60 block select-all">
                                      {paymentDetails.codigo_barras}
                                    </span>
                                  </div>
                                )}
                                <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 text-xs text-blue-200 leading-relaxed">
                                  Você selecionou Boleto. O documento está anexado na seção &quot;Orçamento Anexo&quot; abaixo para visualização e download.
                                </div>
                              </div>
                            )}

                            {paymentDetails.observacoes_adicionais && (
                              <div>
                                <strong className="block text-sm text-zinc-500 mb-1">Observações Adicionais</strong>
                                <span className="text-sm text-zinc-300 block bg-zinc-900 rounded-lg p-3 border border-zinc-800/60 leading-relaxed font-sans">
                                  {paymentDetails.observacoes_adicionais}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {selected.observacoes ? (
                              <div>
                                <strong className="block text-sm text-zinc-500 mb-1">Observações / Dados Bancários</strong>
                                <span className="text-sm text-zinc-300 block bg-zinc-900 rounded-lg p-3 border border-zinc-800/60 leading-relaxed font-sans">
                                  {selected.observacoes}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-500 text-sm">Nenhum dado de pagamento ou observação informado.</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      {selected.tipo === 'reembolso' ? 'Comprovante Anexo' : 'Orçamento Anexo'}
                    </h3>
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
                          className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-8 text-indigo-400 transition hover:bg-zinc-800 hover:text-indigo-300 text-center"
                        >
                          <ExternalLink className="h-5 w-5 shrink-0" />
                          <span className="font-medium text-sm sm:text-base break-words">Abrir Arquivo PDF Original</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Avaliação e Histórico */}
                <div className="space-y-6 flex flex-col">
                  {isApproving ? (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
                      <h3 className="text-sm font-medium text-emerald-400 mb-3">Aprovação de {selected.tipo === 'reembolso' ? 'Reembolso' : 'Pagamento'}</h3>
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
                  ) : selected.status === 'pendente_reembolso' || selected.status === 'pendente_aprovacao' ? (
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
                  ) : selected.status === 'nf_enviada' && selected.tipo === 'orcamento' ? (
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-5 mb-4">
                      <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Validação da Nota Fiscal
                      </h3>
                      <p className="text-sm text-zinc-300 mb-4">
                        O solicitante anexou a Nota Fiscal (Nº {selected.numero_nf || 'Não informado'}). Por favor, visualize o arquivo e valide-o para finalizar este fluxo.
                      </p>

                      {selected.anexo_nf_url && (
                        <a
                          href={selected.anexo_nf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-500 hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Visualizar Nota Fiscal
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          setLoadingAction(`validate_nf:${selected.id}`);
                          setError('');
                          const res = await validarNotaFiscal(selected.id);
                          setLoadingAction('');
                          if (!res.success) setError(res.error || 'Erro ao validar NF.');
                          else {
                            setSelected(null);
                            router.refresh();
                          }
                        }}
                        disabled={loadingAction === `validate_nf:${selected.id}`}
                        className="w-full rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 shadow-md flex justify-center items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {loadingAction === `validate_nf:${selected.id}` ? 'Validando...' : 'Finalizar / Validar NF'}
                      </button>
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

                {(selected.status === 'pendente_reembolso' || selected.status === 'pendente_aprovacao') && (
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
    </div>
  );
}
