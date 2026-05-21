'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { enviarNotaFiscal } from '@/app/actions/pagamentos';

export default function AnexarNFForm({ pagamentoId }: { pagamentoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (file) {
        formData.append('file', file);
      }

      const res = await enviarNotaFiscal(pagamentoId, formData);

      if (!res.success) {
        setError(res.error || 'Erro ao anexar a Nota Fiscal.');
      } else {
        router.push('/pagamentos/minhas-solicitacoes');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Desconhecido';
      setError(`Erro inesperado: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/50 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="numero_nf" className="text-sm font-medium text-zinc-300">
            Número da Nota Fiscal
          </label>
          <input
            id="numero_nf"
            name="numero_nf"
            required
            placeholder="Ex: 001234"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="data_emissao_nf" className="text-sm font-medium text-zinc-300">
            Data de Emissão
          </label>
          <input
            id="data_emissao_nf"
            name="data_emissao_nf"
            type="date"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Arquivo da Nota Fiscal
        </label>
        
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 sm:p-8 transition-colors text-center ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/50'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-4 text-xs font-medium text-indigo-400 hover:text-indigo-300"
              >
                Remover arquivo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <UploadCloud className={`h-10 w-10 mb-4 ${dragActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <p className="text-sm font-medium text-white mb-1 break-words">
                Arraste o arquivo da NF ou clique para enviar
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                PDF, PNG ou JPG (Max. 5MB)
              </p>
              <label className="cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition">
                Selecionar Arquivo
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto rounded-lg px-4 py-3 text-sm font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full sm:w-auto rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Nota Fiscal'}
        </button>
      </div>
    </form>
  );
}
