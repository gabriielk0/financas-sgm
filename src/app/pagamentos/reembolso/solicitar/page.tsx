import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PrivateRoute from '@/components/PrivateRoute';
import ReembolsoStepper from '@/components/ReembolsoStepper';
import ReembolsoTopbar from '@/components/pagamentos/ReembolsoTopbar';

export default function SolicitarReembolsoPage() {
  return (
    <PrivateRoute modulo="reembolso">
      <ReembolsoTopbar />
      <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-50">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/pagamentos/minhas-solicitacoes"
            className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar para Minhas Solicitações
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white">
              Solicitar Reembolso
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Preencha os dados da despesa e envie o comprovante.
            </p>
          </div>
          <ReembolsoStepper />
        </div>
      </main>
    </PrivateRoute>
  );
}

