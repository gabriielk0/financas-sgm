'use client';

import { ChangeEvent, DragEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, FileUp } from 'lucide-react';
import { solicitarReembolso } from '@/app/actions/reembolsos';

const equipes = ['Comando', 'Fichas', 'Pós-encontro', 'Montagem', 'Palestra'];

const steps = ['Identificação', 'Detalhes', 'Pagamento', 'Anexo'];

export default function ReembolsoStepper() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nome_pagador: '',
    equipe: 'Comando',
    descricao: '',
    finalidade: '',
    valor: '',
    chave_pix: '',
  });

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
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
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </label>
            <div>
              <span className="text-sm font-medium text-zinc-300">Equipe</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {equipes.map((equipe) => (
                  <button
                    key={equipe}
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({ ...current, equipe }))
                    }
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      formData.equipe === equipe
                        ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    {equipe}
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
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
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
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Pagamento</h2>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Valor</span>
              <input
                name="valor"
                value={formData.valor}
                onChange={updateField}
                type="number"
                step="0.01"
                min="0"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
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
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
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
              className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-4 py-8 text-center transition hover:border-indigo-500"
            >
              <FileUp className="h-8 w-8 text-zinc-500" />
              <span className="mt-3 text-sm font-medium text-zinc-200">
                {file ? file.name : 'Arraste ou selecione o comprovante'}
              </span>
              <span className="mt-1 text-xs text-zinc-500">
                JPG, PNG ou PDF
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(event) => {
                  const selected = event.currentTarget.files?.[0];
                  if (selected) setFile(selected);
                }}
              />
            </label>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p className="font-medium text-white">Resumo</p>
              <p className="mt-2">{formData.descricao || 'Sem descrição'}</p>
              <p className="mt-1 text-zinc-500">
                {formData.equipe} · R$ {formData.valor || '0,00'} ·{' '}
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
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        )}
      </div>
    </div>
  );
}
