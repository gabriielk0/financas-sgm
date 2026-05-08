'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { FileText, Plus, Image as ImageIcon, Edit2, CheckCircle, AlertTriangle, CalendarCheck, FolderOpen } from 'lucide-react';
import TransactionModal from './TransactionModal';
import AttachmentPreviewModal from './AttachmentPreviewModal';
import { completePayment, closeMonth, reopenMonth } from '@/app/actions/finance';
import { Transaction } from '@prisma/client';

export default function TransactionTable({
  transactions,
  monthClosed,
  monthId,
}: {
  transactions: Transaction[];
  monthClosed: boolean;
  monthId: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ url: string | null; fileName: string }>({
    url: null,
    fileName: '',
  });
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [paymentToConfirm, setPaymentToConfirm] = useState<Transaction | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCloseMonthModalOpen, setIsCloseMonthModalOpen] = useState(false);
  const [isClosingMonth, setIsClosingMonth] = useState(false);
  const [closeMonthError, setCloseMonthError] = useState<string | null>(null);
  const [isReopenMonthModalOpen, setIsReopenMonthModalOpen] = useState(false);
  const [isReopeningMonth, setIsReopeningMonth] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('typeFilter');

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter === 'IN' || typeFilter === 'OUT') {
      return t.type === typeFilter;
    }
    return true; // se não houver filtro ou ele for inválido, retorna tudo
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div>
      <div className="mt-8 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Transações</h3>
          <p className="text-zinc-400 text-sm">Histórico de movimentações do mês selecionado</p>
        </div>
        {!monthClosed && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setCloseMonthError(null);
                setIsCloseMonthModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-zinc-700"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              Fechar Mês
            </button>
            <button
              onClick={() => {
                setTransactionToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
            >
              <Plus className="w-4 h-4" />
              Nova Transação
            </button>
          </div>
        )}
        {monthClosed && (
          <button
            onClick={() => {
              setReopenError(null);
              setIsReopenMonthModalOpen(true);
            }}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-zinc-700"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            Reabrir Mês
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Data</th>
              <th className="px-6 py-4 font-medium">Descrição</th>
              <th className="px-6 py-4 font-medium">Categoria</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Valor</th>
              <th className="px-6 py-4 font-medium text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 text-sm">
                  {transactions.length === 0 
                    ? 'Nenhuma transação encontrada neste mês.'
                    : 'Nenhuma transação corresponde ao filtro selecionado.'}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300">
                    {format(new Date(`${t.date}T12:00:00`), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-100">
                    {t.description}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        t.type === 'IN'
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          : 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                      }`}
                    >
                      {t.type === 'IN' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        t.status === 'COMPLETED'
                          ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                          : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      }`}
                    >
                      {t.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-right font-medium ${
                      t.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {t.type === 'IN' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {!monthClosed && t.status === 'PENDING' && (
                        <button
                          onClick={() => setPaymentToConfirm(t)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400 hover:text-white transition-colors"
                          title="Concluir Pagamento"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {t.attachmentUrl ? (
                        <button
                          onClick={() =>
                            setPreviewData({
                              url: t.attachmentUrl,
                              fileName: `Comprovante_${t.description.replace(/\s+/g, '_')}`,
                            })
                          }
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                          title="Ver Anexo"
                        >
                          {t.attachmentUrl.includes('application/pdf') ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-8 h-8 inline-flex items-center justify-center text-zinc-600 text-xs">-</span>
                      )}

                      {!monthClosed && (
                        <button
                          onClick={() => {
                            setTransactionToEdit(t);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          title="Editar Transação"
                        >
                          <Edit2 className="w-4 h-4" />
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
      
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
        monthId={monthId}
        transactionToEdit={transactionToEdit}
      />

      <AttachmentPreviewModal
        isOpen={!!previewData.url}
        onClose={() => setPreviewData({ url: null, fileName: '' })}
        attachmentUrl={previewData.url}
        fileName={previewData.fileName}
      />

      {/* Modal de confirmação de pagamento */}
      {paymentToConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirmar Pagamento</h3>
                <p className="text-zinc-400 text-sm mt-1">
                  Deseja marcar a transação <strong className="text-zinc-200">&quot;{paymentToConfirm.description}&quot;</strong> como concluída?
                </p>
              </div>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setPaymentToConfirm(null)}
                  disabled={isCompleting}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setIsCompleting(true);
                    await completePayment(paymentToConfirm.id);
                    setIsCompleting(false);
                    setPaymentToConfirm(null);
                  }}
                  disabled={isCompleting}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isCompleting ? 'Concluindo...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de fechamento de mês */}
      {isCloseMonthModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Fechar o Mês?</h3>
                <p className="text-zinc-400 text-sm mt-2">
                  Ao fechar o mês, o saldo final será calculado apenas com as transações <strong className="text-emerald-400">concluídas</strong> e um novo mês será iniciado. Transações pendentes permanecerão pendentes no histórico.
                </p>
                {closeMonthError && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-left">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {closeMonthError}
                  </div>
                )}
                <p className="text-zinc-300 text-sm mt-3 font-medium">
                  Tem certeza que deseja fechar este mês agora?
                </p>
              </div>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setIsCloseMonthModalOpen(false)}
                  disabled={isClosingMonth}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setIsClosingMonth(true);
                    setCloseMonthError(null);
                    try {
                      const res = await closeMonth(monthId);
                      if (res?.error) {
                        setCloseMonthError(res.error);
                      } else {
                        setIsCloseMonthModalOpen(false);
                      }
                    } catch {
                      setCloseMonthError('Ocorreu um erro inesperado ao fechar o mês.');
                    } finally {
                      setIsClosingMonth(false);
                    }
                  }}
                  disabled={isClosingMonth}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                >
                  {isClosingMonth ? 'Fechando...' : 'Fechar Mês'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reabertura de mês */}
      {isReopenMonthModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Reabrir o Mês?</h3>
                <p className="text-zinc-400 text-sm mt-2">
                  Ao reabrir o mês, o mês seguinte gerado automaticamente será <strong className="text-rose-400">apagado</strong> se estiver vazio.
                </p>
                {reopenError && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-left">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {reopenError}
                  </div>
                )}
                <p className="text-zinc-300 text-sm mt-3 font-medium">
                  Tem certeza que deseja reabrir este mês?
                </p>
              </div>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setIsReopenMonthModalOpen(false)}
                  disabled={isReopeningMonth}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setIsReopeningMonth(true);
                    setReopenError(null);
                    const res = await reopenMonth(monthId);
                    setIsReopeningMonth(false);
                    if (res?.error) {
                      setReopenError(res.error);
                    } else {
                      setIsReopenMonthModalOpen(false);
                    }
                  }}
                  disabled={isReopeningMonth}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  {isReopeningMonth ? 'Reabrindo...' : 'Reabrir Mês'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
