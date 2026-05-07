'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Plus, ExternalLink, Image as ImageIcon } from 'lucide-react';
import TransactionModal from './TransactionModal';
import AttachmentPreviewModal from './AttachmentPreviewModal';

export default function TransactionTable({
  transactions,
  monthClosed,
  monthId,
}: {
  transactions: any[];
  monthClosed: boolean;
  monthId: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ url: string | null; fileName: string }>({
    url: null,
    fileName: '',
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <>
      <div className="mt-8 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Transações</h3>
          <p className="text-zinc-400 text-sm">Histórico de movimentações do mês selecionado</p>
        </div>
        {!monthClosed && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
          >
            <Plus className="w-4 h-4" />
            Nova Transação
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
              <th className="px-6 py-4 font-medium text-center">Anexo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 text-sm">
                  Nenhuma transação encontrada neste mês.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300">
                    {format(new Date(t.date), 'dd/MM/yyyy')}
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
                      <span className="text-zinc-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        monthId={monthId}
      />

      <AttachmentPreviewModal
        isOpen={!!previewData.url}
        onClose={() => setPreviewData({ url: null, fileName: '' })}
        attachmentUrl={previewData.url}
        fileName={previewData.fileName}
      />
    </>
  );
}
