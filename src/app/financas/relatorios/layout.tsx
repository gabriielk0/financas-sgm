import FinancasFrame from '@/components/financas/FinancasFrame';
import RelatoriosNav from '@/components/financas/RelatoriosNav';

export const dynamic = 'force-dynamic';

export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinancasFrame>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 print:hidden">
          <h1 className="text-2xl font-semibold text-white">Central de Relatórios</h1>
          <p className="mt-1 text-sm text-zinc-400">Análise estratégica e visão gerencial</p>
          
          <div className="mt-6 border-b border-zinc-800">
            <RelatoriosNav />
          </div>
        </div>

        {/* Estilo de impressão embutido global para relatórios */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { background: white !important; color: black !important; }
            .print\\:hidden { display: none !important; }
            .bg-zinc-900, .bg-zinc-950, .bg-zinc-900\\/50 { background: white !important; }
            .border-zinc-800, .border-zinc-700 { border-color: #ddd !important; }
            .text-white, .text-zinc-300, .text-zinc-400 { color: black !important; }
            .shadow-lg { box-shadow: none !important; }
            .text-indigo-400 { color: #4338ca !important; }
            .text-rose-400 { color: #be123c !important; }
            .text-emerald-400 { color: #047857 !important; }
            .text-amber-400 { color: #b45309 !important; }
          }
        `}} />

        <div className="print:m-0 print:p-0">
          {children}
        </div>
      </main>
    </FinancasFrame>
  );
}
