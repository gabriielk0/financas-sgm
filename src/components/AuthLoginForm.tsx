'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { loginAction, cadastroAction } from '@/app/actions/auth';

type AuthLoginFormProps = {
  modulo: 'financas' | 'reembolso';
};

export default function AuthLoginForm({ modulo }: AuthLoginFormProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isFinance = modulo === 'financas';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const result = await loginAction({
      email,
      password,
      modulo: isFinance ? 'financas' : 'equipe',
    });

    if (result.success && 'token' in result) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('perfil', result.perfil);
      localStorage.setItem('usuario', JSON.stringify(result.user));
      router.replace(result.redirectTo || '/');
      router.refresh();
      return;
    }

    setError(
      'error' in result && result.error
        ? result.error
        : 'Não foi possível fazer login.',
    );
    setLoading(false);
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.append('perfil', isFinance ? 'financas' : 'equipe');

    const result = await cadastroAction(formData);

    setLoading(false);

    if (result.success) {
      setIsLogin(true);
      setSuccessMsg(
        result.message ||
          'Cadastro enviado! Aguarde aprovação da administração.',
      );
    } else {
      setError(result.error || 'Erro ao cadastrar.');
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-900 p-6 sm:p-8 rounded-lg shadow-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="mt-8">
          <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {isLogin
              ? isFinance
                ? 'Login Finanças'
                : 'Login Reembolso'
              : isFinance
                ? 'Cadastro Finanças'
                : 'Cadastro Reembolso'}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {isLogin
              ? 'Entre com e-mail e senha para acessar seu módulo.'
              : 'Preencha os dados para solicitar seu acesso.'}
          </p>
        </div>

        {successMsg && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
            {successMsg}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">E-mail</span>
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 focus-within:border-indigo-500">
                <Mail className="h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  placeholder={
                    isFinance ? 'financas@segueme.local' : 'voce@email.com'
                  }
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Senha</span>
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 focus-within:border-indigo-500">
                <Lock className="h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  placeholder="Digite sua senha"
                  required
                />
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Nome Completo
              </label>
              <input
                name="nome"
                required
                type="text"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="Digite seu nome"
              />
            </div>
            {!isFinance && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Equipe
                </label>
                <select
                  name="equipe"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>
                    Selecione sua equipe
                  </option>
                  <option value="Comando">Comando</option>
                  <option value="Fichas">Fichas</option>
                  <option value="Pós-encontro">Pós-encontro</option>
                  <option value="Montagem">Montagem</option>
                  <option value="Palestra">Palestra</option>
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                E-mail
              </label>
              <input
                name="email"
                required
                type="email"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="voce@email.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                WhatsApp
              </label>
              <input
                name="whatsapp"
                required
                type="text"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <input
                name="senha"
                required
                type="password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="Crie uma senha"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Confirmar Senha
              </label>
              <input
                name="confirmarSenha"
                required
                type="password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="Repita a senha"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Solicitar Acesso'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-400">
          {isLogin ? 'Ainda não tem acesso?' : 'Já tem uma conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMsg('');
            }}
            className="font-medium text-indigo-300 hover:text-indigo-200"
          >
            {isLogin ? 'Solicitar cadastro' : 'Fazer login'}
          </button>
        </p>
      </div>
    </main>
  );
}
