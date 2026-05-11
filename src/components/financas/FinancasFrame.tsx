import PrivateRoute from '@/components/PrivateRoute';
import { contarReembolsosPendentes } from '@/app/actions/reembolsos';
import FinanceShell from './FinanceShell';

export default async function FinancasFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingReimbursements = await contarReembolsosPendentes();

  return (
    <PrivateRoute modulo="financas">
      <FinanceShell pendingReimbursements={pendingReimbursements}>
        {children}
      </FinanceShell>
    </PrivateRoute>
  );
}
