import PrivateRoute from '@/components/PrivateRoute';
import ReembolsoTopbar from '@/components/pagamentos/ReembolsoTopbar';
import AnexarNFForm from '@/components/pagamentos/AnexarNFForm';

export const metadata = {
  title: 'Anexar Nota Fiscal | Finanças SGM',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AnexarNFPage(props: Props) {
  const { id } = await props.params;

  return (
    <PrivateRoute modulo="reembolso">
      <ReembolsoTopbar />
      
      <main className="min-h-screen bg-zinc-950 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white">
              Anexar Nota Fiscal
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              O pagamento desta solicitação já foi realizado pelo financeiro. Envie a NF correspondente para concluir o processo.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
            <AnexarNFForm pagamentoId={id} />
          </div>
        </div>
      </main>
    </PrivateRoute>
  );
}
