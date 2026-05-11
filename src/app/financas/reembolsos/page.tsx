import FinancasFrame from '@/components/financas/FinancasFrame';
import ReembolsosFinanceTable from '@/components/financas/ReembolsosFinanceTable';
import { listarReembolsosPendentes } from '@/app/actions/reembolsos';

export default async function FinancasReembolsosPage() {
  const reembolsos = await listarReembolsosPendentes();

  return (
    <FinancasFrame>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Reembolsos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Solicitações pendentes aguardando aprovação financeira.
          </p>
        </div>

        <ReembolsosFinanceTable reembolsos={reembolsos} />
      </main>
    </FinancasFrame>
  );
}
