import PrivateRoute from '@/components/PrivateRoute';
import ReembolsoTopbar from '@/components/pagamentos/ReembolsoTopbar';
import CadastroPagamentoForm from '@/components/pagamentos/CadastroPagamentoForm';

export const metadata = {
  title: 'Solicitar Pagamento | Finanças SGM',
};

export default function SolicitarPagamentoPage() {
  return (
    <PrivateRoute modulo="reembolso">
      <ReembolsoTopbar />
      
      <main className="min-h-screen bg-zinc-950 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white">
              Pagamento de Orçamento
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Preencha os dados abaixo para solicitar o pagamento de um fornecedor, assinatura ou serviço. O anexo do orçamento/fatura é obrigatório.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
            <CadastroPagamentoForm />
          </div>
        </div>
      </main>
    </PrivateRoute>
  );
}
