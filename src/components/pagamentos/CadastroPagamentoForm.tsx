'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { solicitarPagamento } from '@/app/actions/pagamentos';

const EQUIPES = [
  'Gráfica', 'Alimentação', 'Lanche', 'Mini mercado', 'Estacionamento',
  'Círculo', 'Sala', 'Faxina', 'Liturgia e vigília', 'Visitação',
  'Vigília paroquial', 'Animação', 'Canto', 'Prover', 'Equipe dirigente',
  'Comando', 'Outros'
];

export default function CadastroPagamentoForm() {
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

      const res = await solicitarPagamento(formData);

      if (!res.success) {
        setError(res.error || 'Erro ao criar solicitação.');
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="descricao" className="text-sm font-medium text-zinc-300">
            Descrição do Pagamento
          </label>
          <input
            id="descricao"
            name="descricao"
            required
            placeholder="Ex: Assinatura do Software X"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fornecedor" className="text-sm font-medium text-zinc-300">
            Fornecedor
          </label>
          <input
            id="fornecedor"
            name="fornecedor"
            required
            placeholder="Nome da empresa ou prestador"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="valor_total" className="text-sm font-medium text-zinc-300">
            Valor Total
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
            <input
              id="valor_total"
              name="valor_total"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="data_vencimento" className="text-sm font-medium text-zinc-300">
            Data de Vencimento
          </label>
          <input
            id="data_vencimento"
            name="data_vencimento"
            type="date"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="equipe" className="text-sm font-medium text-zinc-300">
            Centro de Custo / Equipe
          </label>
          <select
            id="equipe"
            name="equipe"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Selecione uma equipe...</option>
            {EQUIPES.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="finalidade" className="text-sm font-medium text-zinc-300">
            Finalidade
          </label>
          <textarea
            id="finalidade"
            name="finalidade"
            required
            rows={3}
            placeholder="Qual a finalidade deste orçamento/pagamento?"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="observacoes" className="text-sm font-medium text-zinc-300">
            Observações (Opcional)
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={2}
            placeholder="Alguma informação adicional para o financeiro?"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Orçamento / Fatura
        </label>
        
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
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
              <p className="text-sm font-medium text-white mb-1">
                Arraste o arquivo do orçamento ou clique para enviar
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

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Solicitação'}
        </button>
      </div>
    </form>
  );
}
