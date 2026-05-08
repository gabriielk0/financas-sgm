'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, FileText, Trash2 } from 'lucide-react';
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/app/actions/finance';
import { Transaction } from '@prisma/client';

export default function TransactionModal({
  isOpen,
  onClose,
  monthId,
  transactionToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  monthId: string;
  transactionToEdit?: Transaction | null;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'OUT' as 'IN' | 'OUT',
    date: new Date().toISOString().split('T')[0],
    status: 'COMPLETED' as 'COMPLETED' | 'PENDING',
  });
  const [file, setFile] = useState<File | null>(null);
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
      });
      if (transactionToEdit.attachmentUrl) {
        setPreview(transactionToEdit.attachmentUrl);
      }
    } else if (isOpen) {
      // Resetar ao abrir para uma nova transação
      setFormData({
        description: '',
        amount: '',
        type: 'OUT',
        date: new Date().toISOString().split('T')[0],
        status: 'COMPLETED',
      });
      setFile(null);
      setPreview(null);
    }
  }, [transactionToEdit, isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      if (selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('description', formData.description);
      submitData.append('amount', formData.amount);
      submitData.append('type', formData.type);
      submitData.append('date', formData.date);
      submitData.append('status', formData.status);

      if (file) {
        submitData.append('file', file);
      }

      if (transactionToEdit) {
        submitData.append('id', transactionToEdit.id);
        await updateTransaction(submitData);
      } else {
        submitData.append('monthId', monthId);
        await addTransaction(submitData);
      }

      setFile(null);
      setPreview(null);
      onClose();
    } catch {
      alert('Erro ao salvar transação.');
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          <h2 className="text-xl font-semibold text-white">
            {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com rolagem */}
        <div className="overflow-y-auto flex-1 p-6">
          <form
            id="transaction-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Descrição
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Tipo e Status
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'IN' })}
                    className={`py-2 rounded-lg text-sm font-medium border ${
                      formData.type === 'IN'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'OUT' })}
                    className={`py-2 rounded-lg text-sm font-medium border ${
                      formData.type === 'OUT'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    Saída
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, status: 'COMPLETED' })
                    }
                    className={`py-2 rounded-lg text-sm font-medium border ${
                      formData.status === 'COMPLETED'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    Concluído
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, status: 'PENDING' })
                    }
                    className={`py-2 rounded-lg text-sm font-medium border ${
                      formData.status === 'PENDING'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    Pendente
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Anexo (Recibo/Comprovante)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-950/50 hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-32 rounded-lg object-contain"
                  />
                ) : file ? (
                  <div className="flex flex-col items-center text-indigo-400">
                    <FileText className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-zinc-500">
                    <UploadCloud className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">
                      Clique para enviar arquivo
                    </span>
                    <span className="text-xs mt-1">
                      PDF, JPG, PNG (máx 5MB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-zinc-800 shrink-0 flex justify-between bg-zinc-900">
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
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
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
