'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cadastroAction } from '@/app/actions/auth';

const equipes = [
  'Comando',
  'Fichas',
  'Pós-encontro',
  'Montagem',
  'Palestras',
  'Prover',
];

export default function CadastroReembolsoForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const result = await cadastroAction(formData);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      event.currentTarget.reset();
      return;
    }

    setError(result.error || 'Não foi possível enviar o cadastro.');
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 rounded-lg shadow-xl">
        <Link
          href="/pagamentos/login"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>

        <div className="mt-8">
          <h1 className="text-2xl font-semibold text-white">
            Cadastro para Reembolso
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            O acesso fica pendente até aprovação da equipe de finanças.
          </p>
        </div>

        {success ? (
          <div className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-100">
            <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-300" />
            <h2 className="font-semibold">Cadastro enviado!</h2>
            <p className="mt-1 text-sm text-emerald-100/80">
              Aguarde aprovação.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-300">Nome</span>
              <input
                name="nome"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Equipe</span>
              <select
                name="equipe"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
                required
              >
                {equipes.map((equipe) => (
                  <option key={equipe} value={equipe}>
                    {equipe}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">WhatsApp</span>
              <input
                name="whatsapp"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
                placeholder="5599999999999"
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-300">E-mail</span>
              <input
                name="email"
                type="email"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Senha</span>
              <input
                name="senha"
                type="password"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Confirmar senha
              </span>
              <input
                name="confirmarSenha"
                type="password"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
                required
              />
            </label>

            {error && (
              <p className="sm:col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar cadastro'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

