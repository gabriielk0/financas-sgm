'use client';

import { ChangeEvent, DragEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, FileUp, Loader2, FileText } from 'lucide-react';
import { solicitarReembolso } from '@/app/actions/reembolsos';

const areas = [
  'Gráfica', 'Alimentação', 'Lanche', 'Mini mercado', 'Estacionamento',
  'Círculo', 'Sala', 'Faxina', 'Liturgia e vigília', 'Visitação',
  'Vigília paroquial', 'Animação', 'Canto', 'Prover', 'Equipe dirigente',
  'Comando', 'Outros'
];

const steps = ['Identificação', 'Detalhes', 'Pagamento', 'Anexo'];

export default function ReembolsoStepper() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome_pagador: '',
    equipe: 'Outros', // Será a Área/Equipe da despesa
    descricao: '',
    finalidade: '',
    valor: '',
    chave_pix: '',
  });

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function updateSelectedFile(nextFile: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);

    if (nextFile && nextFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(nextFile));
      return;
    }

    setPreviewUrl(null);
  }

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function updateValor(event: ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setFormData((prev) => ({ ...prev, valor: '' }));
      return;
    }
    const numValue = (parseInt(rawValue, 10) / 100).toFixed(2);
    setFormData((prev) => ({ ...prev, valor: numValue }));
  }

  function formatDisplayValor(valor: string) {
    if (!valor) return '';
    const num = parseFloat(valor);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) updateSelectedFile(droppedFile);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });
    if (file) payload.append('file', file);

    const result = await solicitarReembolso(payload);
    setLoading(false);

    if (result.success) {
      router.push('/reembolso/minhas-solicitacoes');
      router.refresh();
      return;
    }

    setError(result.error || 'Não foi possível concluir a solicitação.');
  }

  return (
    <div className="w-full max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:p-8 shadow-xl">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((label, index) => {
          const complete = index < step;
          const active = index === step;

          return (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className="min-w-0 text-left"
            >
              <span
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                  active
                    ? 'border-indigo-400 bg-indigo-600 text-white'
                    : complete
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                      : 'border-zinc-700 bg-zinc-950 text-zinc-500'
                }`}
              >
                {complete ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className="mt-2 block truncate text-center text-xs text-zinc-400">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 min-h-80">
        {step === 0 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Identificação</h2>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Nome de quem pagou
              </span>
              <input
                name="nome_pagador"
                value={formData.nome_pagador}
                onChange={updateField}
                placeholder="Ex: João da Silva"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </label>
            <div>
              <span className="text-sm font-medium text-zinc-300">Área / Equipe da Despesa</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {areas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({ ...current, equipe: area }))
                    }
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      formData.equipe === area
                        ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Detalhes</h2>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Descrição
              </span>
              <input
                name="descricao"
                value={formData.descricao}
                onChange={updateField}
                placeholder="Ex: Compra de materiais para decoração"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Finalidade
              </span>
              <textarea
                name="finalidade"
                value={formData.finalidade}
                onChange={updateField}
                rows={6}
                placeholder="Ex: Utilizado para decorar a entrada do salão principal"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500 placeholder:text-zinc-600 resize-none"
              />
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Pagamento</h2>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Valor (R$)</span>
              <input
                name="valor"
                value={formatDisplayValor(formData.valor)}
                onChange={updateValor}
                type="tel"
                placeholder="R$ 0,00"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Chave PIX
              </span>
              <input
                name="chave_pix"
                value={formData.chave_pix}
                onChange={updateField}
                placeholder="CPF, Celular, E-mail ou Chave Aleatória"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </label>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Anexo</h2>
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-4 py-8 text-center transition hover:border-indigo-500 overflow-hidden relative group"
            >
              {previewUrl ? (
                <div className="absolute inset-0 w-full h-full p-2">
                  <div className="w-full h-full relative rounded-md overflow-hidden border border-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-zinc-900" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium px-4 py-2 bg-indigo-600 rounded-lg">Trocar imagem</span>
                    </div>
                  </div>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-indigo-400 mb-3" />
                  <span className="text-sm font-medium text-indigo-200">{file.name}</span>
                  <span className="mt-2 text-xs text-zinc-500 px-3 py-1 bg-zinc-900 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition">Trocar arquivo</span>
                </div>
              ) : (
                <>
                  <FileUp className="h-8 w-8 text-zinc-500" />
                  <span className="mt-3 text-sm font-medium text-zinc-200">
                    Arraste ou selecione o comprovante
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">
                    JPG, PNG ou PDF
                  </span>
                </>
              )}
              
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(event) => {
                  const selected = event.currentTarget.files?.[0];
                  if (selected) updateSelectedFile(selected);
                }}
              />
            </label>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p className="font-medium text-white">Resumo</p>
              <p className="mt-2">{formData.descricao || 'Sem descrição'}</p>
              <p className="mt-1 text-zinc-500">
                {formData.equipe} · {formatDisplayValor(formData.valor) || 'R$ 0,00'} ·{' '}
                {formData.chave_pix || 'PIX não informado'}
              </p>
            </div>
          </section>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || loading}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Voltar
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(3, current + 1))}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Próximo
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        )}
      </div>
    </div>
  );
}
