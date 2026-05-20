import PrivateRoute from '@/components/PrivateRoute';
import ReembolsoStepper from '@/components/ReembolsoStepper';
import ReembolsoTopbar from '@/components/pagamentos/ReembolsoTopbar';

export default function SolicitarReembolsoPage() {
  return (
    <PrivateRoute modulo="reembolso">
      <ReembolsoTopbar />
      <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-50">
        <div className="mx-auto max-w-5xl">
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

