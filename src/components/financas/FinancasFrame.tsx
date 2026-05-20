import PrivateRoute from '@/components/PrivateRoute';
import { contarReembolsosPendentes } from '@/app/actions/reembolsos';
import { contarPagamentosPendentes } from '@/app/actions/pagamentos';
import FinanceShell from './FinanceShell';

export default async function FinancasFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingReimbursements = await contarReembolsosPendentes();
  const pendingPagamentos = await contarPagamentosPendentes();
  const totalPending = pendingReimbursements + pendingPagamentos;

  return (
    <PrivateRoute modulo="financas">
      <FinanceShell pendingReimbursements={totalPending}>
        {children}
      </FinanceShell>
    </PrivateRoute>
  );
}
