import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
          <Link
            href="/pagamentos/minhas-solicitacoes"
            className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar para Minhas Solicitações
          </Link>

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
