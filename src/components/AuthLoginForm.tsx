'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Lock, Mail, Loader2 } from 'lucide-react';
import { loginAction, cadastroAction } from '@/app/actions/auth';
import { loginSchema, cadastroSchema } from '@/lib/validations';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isFinance = modulo === 'financas';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccessMsg('');
    setLoading(true);

    const loginData = {
      email,
      password,
      modulo: isFinance ? ('financas' as const) : ('equipe' as const),
    };

    const validation = loginSchema.safeParse(loginData);
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

    const result = await loginAction({
      email,
      password,
      modulo: isFinance ? 'financas' : 'equipe',
    });

    if (result.success && 'token' in result) {
      localStorage.setItem('token', result.token || '');
      localStorage.setItem('perfil', result.perfil || '');
      localStorage.setItem('usuario', JSON.stringify(result.user || {}));
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
    setFieldErrors({});
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      nome: String(formData.get('nome') || ''),
      equipe: !isFinance ? String(formData.get('equipe') || '') : undefined,
      email: String(formData.get('email') || ''),
      whatsapp: String(formData.get('whatsapp') || ''),
      senha: String(formData.get('senha') || ''),
      confirmarSenha: String(formData.get('confirmarSenha') || ''),
      perfil: isFinance ? ('financas' as const) : ('equipe' as const),
    };

    const validation = cadastroSchema.safeParse(data);
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

    formData.set('perfil', isFinance ? 'financas' : 'equipe');

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
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  placeholder={
                    isFinance ? 'financas@segueme.local' : 'voce@email.com'
                  }
                />
              </span>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.email}</p>
              )}
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
                />
              </span>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.password}</p>
              )}
            </label>

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
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
                type="text"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="Digite seu nome"
              />
              {fieldErrors.nome && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.nome}</p>
              )}
            </div>
            {!isFinance && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Equipe
                </label>
                <select
                  name="equipe"
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
                {fieldErrors.equipe && (
                  <p className="mt-1 text-xs text-rose-500">{fieldErrors.equipe}</p>
                )}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                E-mail
              </label>
              <input
                name="email"
                type="text"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="voce@email.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                WhatsApp
              </label>
              <input
                name="whatsapp"
                type="text"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="(11) 99999-9999"
              />
              {fieldErrors.whatsapp && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.whatsapp}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <input
                name="senha"
                type="password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="Crie uma senha"
              />
              {fieldErrors.senha && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.senha}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Confirmar Senha
              </label>
              <input
                name="confirmarSenha"
                type="password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                placeholder="Repita a senha"
              />
              {fieldErrors.confirmarSenha && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.confirmarSenha}</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Solicitar Acesso'
              )}
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
              setFieldErrors({});
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
