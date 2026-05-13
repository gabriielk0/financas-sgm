'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Trash2, Plus, X } from 'lucide-react';
import { Usuario } from '@prisma/client';
import { formatDateUTC } from '@/lib/date-utils';
import {
  atualizarUsuarioStatus,
  excluirUsuario,
  cadastroAction,
} from '@/app/actions/auth';

export default function UsuariosApprovalTable({
  usuarios,
}: {
  usuarios: Usuario[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function updateStatus(usuarioId: string, status: 'ativo' | 'inativo') {
    setLoadingId(`${usuarioId}:${status}`);
    setError('');

    const result = await atualizarUsuarioStatus(usuarioId, status);

    setLoadingId('');

    if (!result.success) {
      setError(result.error || 'Não foi possível atualizar o usuário.');
      return;
    }

    router.refresh();
  }

  async function handleDelete(usuarioId: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    setLoadingId(`${usuarioId}:delete`);
    setError('');

    const result = await excluirUsuario(usuarioId);
    setLoadingId('');
    if (!result.success) {
      setError(result.error || 'Não foi possível excluir o usuário.');
      return;
    }
    router.refresh();
  }

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    setError('');

    const result = await cadastroAction(formData);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Erro ao cadastrar.');
      return;
    }

    setIsModalOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
        </button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        {error && (
          <div className="border-b border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Equipe</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {usuarios.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-zinc-800/60">
                    <td className="px-4 py-4 text-sm font-medium text-white">
                      {usuario.nome}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {usuario.equipe}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {usuario.email}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {usuario.whatsapp}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          usuario.status === 'ativo'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : usuario.status === 'inativo'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {usuario.status === 'aguardando_aprovacao'
                          ? 'Pendente'
                          : usuario.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      {formatDateUTC(usuario.criado_em)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void updateStatus(usuario.id, 'ativo')}
                          disabled={loadingId === `${usuario.id}:ativo`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                          title="Ativar"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(usuario.id, 'inativo')
                          }
                          disabled={loadingId === `${usuario.id}:inativo`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300 transition hover:bg-amber-500 hover:text-white disabled:opacity-50"
                          title="Inativar"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(usuario.id)}
                          disabled={loadingId === `${usuario.id}:delete`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Novo Usuário</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Nome Completo
                </label>
                <input
                  name="nome"
                  required
                  type="text"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Perfil de Acesso
                </label>
                <select
                  name="perfil"
                  required
                  defaultValue="equipe"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="equipe">Equipe (Reembolso)</option>
                  <option value="financas">Finanças (Administração)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Equipe (Obrigatório para o perfil Equipe)
                </label>
                <select
                  name="equipe"
                  defaultValue=""
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>
                    Selecione a equipe
                  </option>
                  <option value="Comando">Comando</option>
                  <option value="Fichas">Fichas</option>
                  <option value="Pós-encontro">Pós-encontro</option>
                  <option value="Montagem">Montagem</option>
                  <option value="Palestra">Palestra</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  E-mail
                </label>
                <input
                  name="email"
                  required
                  type="email"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
