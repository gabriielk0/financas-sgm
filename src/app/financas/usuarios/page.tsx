import { listarUsuarios } from '@/app/actions/auth';
import FinancasFrame from '@/components/financas/FinancasFrame';
import UsuariosApprovalTable from '@/components/financas/UsuariosApprovalTable';

export default async function FinancasUsuariosPage() {
  const usuarios = await listarUsuarios();

  return (
    <FinancasFrame>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">
            Gestão de Usuários
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie todos os usuários cadastrados no sistema.
          </p>
        </div>

        <UsuariosApprovalTable usuarios={usuarios} />
      </main>
    </FinancasFrame>
  );
}
