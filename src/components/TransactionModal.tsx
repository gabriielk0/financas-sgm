'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, FileText, Trash2, Receipt, Info } from 'lucide-react';
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/app/actions/finance';
import type { TransactionWithAttachments } from '@/types/finance';

const AREAS = [
  'Gráfica',
  'Alimentação',
  'Lanche',
  'Mini mercado',
  'Estacionamento',
  'Círculo',
  'Sala',
  'Faxina',
  'Liturgia e vigília',
  'Visitação',
  'Vigília paroquial',
  'Animação',
  'Canto',
  'Prover',
  'Equipe dirigente',
  'Comando',
  'Outros'
];

export default function TransactionModal({
  isOpen,
  onClose,
  monthId,
  transactionToEdit,
  isMonthClosed = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  monthId: string;
  transactionToEdit?: TransactionWithAttachments | null;
  isMonthClosed?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRetroativo, setIsRetroativo] = useState(isMonthClosed);
  const [motivoRetroativo, setMotivoRetroativo] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'OUT' as 'IN' | 'OUT',
    date: new Date().toISOString().split('T')[0],
    status: 'COMPLETED' as 'COMPLETED' | 'PENDING',
    area: 'Outros',
    internalNotes: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transactionToEdit && isOpen) {
      const type = transactionToEdit.type === 'IN' ? 'IN' : 'OUT';
      const status =
        transactionToEdit.status === 'PENDING' ? 'PENDING' : 'COMPLETED';

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        description: transactionToEdit.description,
        amount: transactionToEdit.amount.toString(),
        type,
        date: new Date(transactionToEdit.date).toISOString().split('T')[0],
        status,
        area: transactionToEdit.area || 'Outros',
        internalNotes: transactionToEdit.internalNotes || '',
      });
      setFiles([]);
      setPreview(null);
      setSubmitError(null);
    } else if (isOpen) {
      // Resetar ao abrir para uma nova transação
      setFormData({
        description: '',
        amount: '',
        type: 'OUT',
        date: new Date().toISOString().split('T')[0],
        status: 'COMPLETED',
        area: 'Outros',
        internalNotes: '',
      });
      setFiles([]);
      setPreview(null);
      setSubmitError(null);
    }
  }, [transactionToEdit, isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      const firstImage = selectedFiles.find((selectedFile) =>
        selectedFile.type.startsWith('image/'),
      );
      setPreview(firstImage ? URL.createObjectURL(firstImage) : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      if (isMonthClosed || isRetroativo) {
        if (!motivoRetroativo.trim()) {
          setSubmitError('Por favor, informe o motivo do lançamento retroativo.');
          setLoading(false);
          return;
        }
      }

      const submitData = new FormData();
      submitData.append('description', formData.description);
      submitData.append('amount', formData.amount);
      submitData.append('type', formData.type);
      submitData.append('date', formData.date);
      submitData.append('status', formData.status);
      submitData.append('area', formData.area);
      if (isMonthClosed || isRetroativo) {
        submitData.append('isRetroativo', 'true');
        submitData.append('motivoRetroativo', motivoRetroativo.trim());
      }
      if (formData.internalNotes) {
        submitData.append('internalNotes', formData.internalNotes);
      }

      files.forEach((selectedFile) => {
        submitData.append('files', selectedFile);
      });

      if (transactionToEdit) {
        submitData.append('id', transactionToEdit.id);
        const result = await updateTransaction(submitData);
        if (!result.success) {
          setSubmitError(result.error || 'Erro ao salvar transação.');
          return;
        }
      } else {
        submitData.append('monthId', monthId);
        const result = await addTransaction(submitData);
        if (!result.success) {
          setSubmitError(result.error || 'Erro ao salvar transação.');
          return;
        }
      }

      setFiles([]);
      setPreview(null);
      onClose();
    } catch {
      setSubmitError('Erro ao salvar transação.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionToEdit) return;
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      setLoading(true);
      try {
        await deleteTransaction(transactionToEdit.id);
        onClose();
      } catch {
        alert('Erro ao excluir transação.');
      } finally {
        setLoading(false);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-hidden">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            {transactionToEdit?.reembolso && <Receipt className="w-5 h-5 text-amber-400" />}
            {transactionToEdit
              ? transactionToEdit.reembolso
                ? 'Lançamento de Reembolso'
                : 'Editar Transação'
              : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com rolagem */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8">
          <form
            id="transaction-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Coluna Esquerda: Dados Principais */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Informações Básicas</h3>
              
              {isMonthClosed && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-xs space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5 text-sm">
                    <Info className="w-4 h-4" /> Lançamento Retroativo em Mês Fechado
                  </div>
                  <p>Este mês está encerrado. Informe obrigatoriamente o motivo de este lançamento estar sendo feito com atraso.</p>
                </div>
              )}

              {submitError && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {submitError}
                </div>
              )}

              {(isMonthClosed || isRetroativo) && (
                <div>
                  <label className="block text-sm font-medium text-amber-300 mb-1.5">
                    Motivo do Lançamento Retroativo / Atrasado *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={motivoRetroativo}
                    onChange={(e) => setMotivoRetroativo(e.target.value)}
                    placeholder="Informe o motivo pelo qual este pagamento/recebimento está sendo registrado fora do prazo..."
                    className="w-full px-4 py-2 bg-zinc-950 border border-amber-500/40 rounded-lg text-white placeholder-zinc-500 text-xs focus:border-amber-400 focus:outline-none transition-colors resize-none"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Descrição do Lançamento
                </label>
                <input
                  type="text"
                  required
                  disabled={!!transactionToEdit?.reembolso}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={!!transactionToEdit?.reembolso}
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    disabled={!!transactionToEdit?.reembolso}
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Área/Equipe
                </label>
                <select
                  required
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none transition-colors"
                >
                  {AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Classificação
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      disabled={!!transactionToEdit?.reembolso}
                      onClick={() => setFormData({ ...formData, type: 'IN' })}
                      className={`py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                        formData.type === 'IN'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Entrada
                    </button>
                    <button
                      type="button"
                      disabled={!!transactionToEdit?.reembolso}
                      onClick={() => setFormData({ ...formData, type: 'OUT' })}
                      className={`py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                        formData.type === 'OUT'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Saída
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, status: 'COMPLETED' })
                      }
                      className={`py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.status === 'COMPLETED'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Concluído
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, status: 'PENDING' })
                      }
                      className={`py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Pendente
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Anexos, Observações e Reembolso */}
            <div className="space-y-5 flex flex-col">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Complementos</h3>
              
              {transactionToEdit?.reembolso && (
                <div className="mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-zinc-300">
                  <div className="flex items-center gap-2 mb-3 text-indigo-400 font-medium">
                    <Info className="w-4 h-4" />
                    Detalhes do Reembolso Original
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <span className="block text-xs text-zinc-500 mb-0.5">Solicitante</span>
                      <span className="font-medium text-zinc-200">{transactionToEdit.reembolso.nome_pagador}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-zinc-500 mb-0.5">Equipe</span>
                      <span className="font-medium text-zinc-200">{transactionToEdit.reembolso.equipe}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-xs text-zinc-500 mb-0.5">Finalidade</span>
                      <span className="font-medium text-zinc-200">{transactionToEdit.reembolso.finalidade}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-xs text-zinc-500 mb-0.5">Chave PIX</span>
                      <span className="font-medium text-zinc-200">{transactionToEdit.reembolso.chave_pix}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-zinc-500 mb-0.5">Status Original</span>
                      <span className="font-medium text-amber-400">{transactionToEdit.reembolso.status}</span>
                    </div>
                  </div>
                  {transactionToEdit.reembolso.descricao && (
                    <div className="mt-3 pt-3 border-t border-indigo-500/10">
                      <span className="block text-xs text-zinc-500 mb-0.5">Descrição do solicitante</span>
                      <span className="text-zinc-300 italic">&quot;{transactionToEdit.reembolso.descricao}&quot;</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Observações Internas <span className="text-zinc-500 text-xs font-normal">(apenas admins)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.internalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, internalNotes: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                  placeholder="Anotações adicionais visíveis apenas para a administração..."
                />
              </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Anexos (Recibos e Comprovantes)
              </label>
              {transactionToEdit && transactionToEdit.attachments.length > 0 && files.length === 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {transactionToEdit.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {attachment.filename}
                    </a>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50 hover:bg-zinc-900 cursor-pointer transition-colors"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 rounded-lg object-contain"
                  />
                ) : files.length > 0 ? (
                  <div className="flex flex-col items-center text-indigo-400">
                    <FileText className="w-10 h-10 mb-3" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {files.length === 1 ? files[0].name : `${files.length} arquivos selecionados`}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-zinc-500">
                    <UploadCloud className="w-10 h-10 mb-3 text-zinc-600" />
                    <span className="text-sm font-medium text-zinc-300">
                      Clique ou arraste para anexar
                    </span>
                    <span className="text-xs mt-1.5 text-zinc-500">
                      Formatos suportados: PDF, JPG, PNG (máx 5MB)
                    </span>
                  </div>
                )}
              </div>
            </div>
            </div>
          </form>
        </div>

        {/* Rodapé Fixo */}
        <div className="p-5 md:px-8 border-t border-zinc-800 shrink-0 flex justify-between items-center bg-zinc-900/80 backdrop-blur-md">
          {transactionToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          ) : (
            <div></div> // Espaçador
          )}

          <button
            type="submit"
            form="transaction-form"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {loading
              ? 'Salvando...'
              : transactionToEdit
                ? 'Atualizar'
                : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
