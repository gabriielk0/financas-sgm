'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle2, QrCode, Building2, FileText, Loader2 } from 'lucide-react';
import { solicitarPagamento } from '@/app/actions/pagamentos';
import { pagamentoSchema } from '@/lib/validations';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'transferencia' | 'boleto' | ''>('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (file) {
        formData.append('file', file);
      }

      const rawData = {
        descricao: formData.get('descricao') as string,
        fornecedor: formData.get('fornecedor') as string,
        valor_total: formData.get('valor_total') as string,
        data_vencimento: formData.get('data_vencimento') as string,
        equipe: formData.get('equipe') as string,
        finalidade: formData.get('finalidade') as string,
        metodo_pagamento: formData.get('metodo_pagamento') as string,
        chave_pix: formData.get('chave_pix') as string || undefined,
        pix_nome: formData.get('pix_nome') as string || undefined,
        pix_banco: formData.get('pix_banco') as string || undefined,
        banco: formData.get('banco') as string || undefined,
        agencia: formData.get('agencia') as string || undefined,
        conta: formData.get('conta') as string || undefined,
        cpf_cnpj: formData.get('cpf_cnpj') as string || undefined,
        codigo_barras: formData.get('codigo_barras') as string || undefined,
        observacoes: formData.get('observacoes') as string || undefined,
      };

      const validation = pagamentoSchema.safeParse(rawData);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFieldErrors(errors);
        setLoading(false);
        return;
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

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="descricao" className="text-sm font-medium text-zinc-300">
            Descrição do Pagamento
          </label>
          <input
            id="descricao"
            name="descricao"
            placeholder="Ex: Assinatura do Software X"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldErrors.descricao && (
            <p className="text-xs text-rose-500 mt-1">{fieldErrors.descricao}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="fornecedor" className="text-sm font-medium text-zinc-300">
            Fornecedor
          </label>
          <input
            id="fornecedor"
            name="fornecedor"
            placeholder="Nome da empresa ou prestador"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldErrors.fornecedor && (
            <p className="text-xs text-rose-500 mt-1">{fieldErrors.fornecedor}</p>
          )}
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
              placeholder="0,00"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {fieldErrors.valor_total && (
            <p className="text-xs text-rose-500 mt-1">{fieldErrors.valor_total}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="data_vencimento" className="text-sm font-medium text-zinc-300">
            Data de Vencimento
          </label>
          <input
            id="data_vencimento"
            name="data_vencimento"
            type="date"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldErrors.data_vencimento && (
            <p className="text-xs text-rose-500 mt-1">{fieldErrors.data_vencimento}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="equipe" className="text-sm font-medium text-zinc-300">
            Centro de Custo / Equipe
          </label>
          <select
            id="equipe"
            name="equipe"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Selecione uma equipe...</option>
            {EQUIPES.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
          {fieldErrors.equipe && (
            <p className="text-xs text-rose-500 mt-1">{fieldErrors.equipe}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="finalidade" className="text-sm font-medium text-zinc-300">
            Finalidade
          </label>
          <textarea
            id="finalidade"
            name="finalidade"
            rows={3}
            placeholder="Qual a finalidade deste orçamento/pagamento?"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          {fieldErrors.finalidade && (
            <p className="text-xs text-rose-500 mt-1">{fieldErrors.finalidade}</p>
          )}
        </div>

        {/* Sistema Estruturado de Forma de Pagamento */}
        <div className="space-y-3 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-300 block">
            Forma de Pagamento <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Opção PIX */}
            <label
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                metodoPagamento === 'pix'
                  ? 'border-indigo-500 bg-indigo-600/10 text-white shadow-lg shadow-indigo-600/5'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <input
                type="radio"
                name="metodo_pagamento"
                value="pix"
                checked={metodoPagamento === 'pix'}
                onChange={() => setMetodoPagamento('pix')}
                className="sr-only"
              />
              <QrCode className={`w-5 h-5 shrink-0 ${metodoPagamento === 'pix' ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <div className="text-left">
                <p className="text-sm font-semibold">PIX</p>
                <p className="text-xs text-zinc-500">Chave rápida</p>
              </div>
            </label>

            {/* Opção Transferência */}
            <label
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                metodoPagamento === 'transferencia'
                  ? 'border-indigo-500 bg-indigo-600/10 text-white shadow-lg shadow-indigo-600/5'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <input
                type="radio"
                name="metodo_pagamento"
                value="transferencia"
                checked={metodoPagamento === 'transferencia'}
                onChange={() => setMetodoPagamento('transferencia')}
                className="sr-only"
              />
              <Building2 className={`w-5 h-5 shrink-0 ${metodoPagamento === 'transferencia' ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <div className="text-left">
                <p className="text-sm font-semibold">Transferência</p>
                <p className="text-xs text-zinc-500">TED/DOC/Depósito</p>
              </div>
            </label>

            {/* Opção Boleto */}
            <label
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                metodoPagamento === 'boleto'
                  ? 'border-indigo-500 bg-indigo-600/10 text-white shadow-lg shadow-indigo-600/5'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <input
                type="radio"
                name="metodo_pagamento"
                value="boleto"
                checked={metodoPagamento === 'boleto'}
                onChange={() => setMetodoPagamento('boleto')}
                className="sr-only"
              />
              <FileText className={`w-5 h-5 shrink-0 ${metodoPagamento === 'boleto' ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <div className="text-left">
                <p className="text-sm font-semibold">Boleto Bancário</p>
                <p className="text-xs text-zinc-500">Código de barras</p>
              </div>
            </label>
          </div>
          {fieldErrors.metodo_pagamento && (
            <p className="text-xs text-rose-500 mt-1">{fieldErrors.metodo_pagamento}</p>
          )}
        </div>

        {/* Campos Condicionais baseados na Forma de Pagamento */}
        {metodoPagamento === 'pix' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:col-span-2 transition-all duration-200">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="chave_pix" className="text-sm font-medium text-zinc-300">
                Chave PIX <span className="text-rose-500">*</span>
              </label>
              <input
                id="chave_pix"
                name="chave_pix"
                placeholder="CPF/CNPJ, E-mail, Telefone ou Chave Aleatória"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.chave_pix && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.chave_pix}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="pix_nome" className="text-sm font-medium text-zinc-300">
                Nome do Beneficiário / Titular (Opcional)
              </label>
              <input
                id="pix_nome"
                name="pix_nome"
                placeholder="Para conferência do PIX"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.pix_nome && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.pix_nome}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="pix_banco" className="text-sm font-medium text-zinc-300">
                Banco / Instituição (Opcional)
              </label>
              <input
                id="pix_banco"
                name="pix_banco"
                placeholder="Ex: Nubank, Itaú, BB"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.pix_banco && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.pix_banco}</p>
              )}
            </div>
          </div>
        )}

        {metodoPagamento === 'transferencia' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:col-span-2 transition-all duration-200">
            <div className="space-y-2">
              <label htmlFor="banco" className="text-sm font-medium text-zinc-300">
                Banco <span className="text-rose-500">*</span>
              </label>
              <input
                id="banco"
                name="banco"
                placeholder="Ex: Banco do Brasil"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.banco && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.banco}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="agencia" className="text-sm font-medium text-zinc-300">
                Agência <span className="text-rose-500">*</span>
              </label>
              <input
                id="agencia"
                name="agencia"
                placeholder="Ex: 1234"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.agencia && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.agencia}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="conta" className="text-sm font-medium text-zinc-300">
                Conta (com dígito) <span className="text-rose-500">*</span>
              </label>
              <input
                id="conta"
                name="conta"
                placeholder="Ex: 12345-6"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.conta && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.conta}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-3">
              <label htmlFor="cpf_cnpj" className="text-sm font-medium text-zinc-300">
                CPF/CNPJ do Titular (Opcional)
              </label>
              <input
                id="cpf_cnpj"
                name="cpf_cnpj"
                placeholder="Ex: 000.000.000-00"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.cpf_cnpj && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.cpf_cnpj}</p>
              )}
            </div>
          </div>
        )}

        {metodoPagamento === 'boleto' && (
          <div className="space-y-4 sm:col-span-2 transition-all duration-200">
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 text-sm text-blue-200 leading-relaxed">
              Você selecionou Boleto. Por favor, certifique-se de anexar o arquivo do boleto junto com o orçamento na área de upload abaixo.
            </div>
            <div className="space-y-2">
              <label htmlFor="codigo_barras" className="text-sm font-medium text-zinc-300">
                Código de Barras / Linha Digitável (Opcional)
              </label>
              <input
                id="codigo_barras"
                name="codigo_barras"
                placeholder="Ex: 00190.00009 02708.318006 41256.345678 1 93240000035000"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.codigo_barras && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.codigo_barras}</p>
              )}
            </div>
          </div>
        )}

        {/* Campo de observações mantido opcional */}
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="observacoes" className="text-sm font-medium text-zinc-300">
            Observações Adicionais (Opcional)
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={2}
            placeholder="Alguma informação adicional para o financeiro?"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          {fieldErrors.observacoes && (
            <p className="text-xs text-rose-500 mt-1">{fieldErrors.observacoes}</p>
          )}
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
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Solicitação'
          )}
        </button>
      </div>
    </form>
  );
}
