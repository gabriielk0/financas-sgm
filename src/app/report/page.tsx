import { getCurrentMonth, getMonths, getTransactions } from '../actions/finance';
import { format } from 'date-fns';
import PrintButton from '@/components/PrintButton';

export default async function ReportPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  const currentMonth = await getCurrentMonth();
  const monthsHistory = await getMonths();
  const view = (searchParams?.view as string) || 'monthly';
  
  if (!currentMonth && monthsHistory.length === 0) {
    return <div>Dados não encontrados.</div>;
  }

  const paramMonthId = searchParams?.monthId as string | undefined;
  const activeMonth = paramMonthId
    ? monthsHistory.find((m) => m.id === paramMonthId) || currentMonth || monthsHistory[0]
    : currentMonth || monthsHistory[0];

  let transactions: any[] = [];
  let initialBalance = activeMonth.initialBalance;

  if (view === 'monthly') {
    transactions = await getTransactions(activeMonth.id);
    // Sort transactions chronologically for the report
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (view === 'semiannual') {
    const currentIndex = monthsHistory.findIndex((m) => m.id === activeMonth.id);
    const targetMonths = monthsHistory.slice(currentIndex, currentIndex + 6);
    const monthIds = targetMonths.map((m) => m.id);
    
    const allTxs = await Promise.all(monthIds.map(id => getTransactions(id)));
    transactions = allTxs.flat().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const oldestMonth = targetMonths[targetMonths.length - 1];
    initialBalance = oldestMonth?.initialBalance || 0;
  } else if (view === 'annual') {
    const currentYear = activeMonth.year;
    const yearMonths = monthsHistory.filter((m) => m.year === currentYear);
    const monthIds = yearMonths.map((m) => m.id);

    const allTxs = await Promise.all(monthIds.map(id => getTransactions(id)));
    transactions = allTxs.flat().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const oldestMonth = yearMonths[yearMonths.length - 1];
    initialBalance = oldestMonth?.initialBalance || 0;
  }

  // Apenas transações concluídas afetam o relatório contábil
  const completedTransactions = transactions.filter(t => t.status === 'COMPLETED');
  
  const incomes = completedTransactions.filter(t => t.type === 'IN');
  const expenses = completedTransactions.filter(t => t.type === 'OUT');

  const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
  const subTotal = initialBalance + totalIncome;
  const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
  const finalBalance = subTotal - totalExpense;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  let periodText = '';
  if (view === 'monthly') {
    periodText = `Mês: ${activeMonth.month.toString().padStart(2, '0')}/${activeMonth.year}`;
  } else if (view === 'semiannual') {
    periodText = `Semestre a partir de ${activeMonth.month.toString().padStart(2, '0')}/${activeMonth.year}`;
  } else {
    periodText = `Ano de ${activeMonth.year}`;
  }

  return (
    <>
      {/* Script to automatically trigger print dialog */}
      <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
      
      {/* Global CSS to override dark mode body background during print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background-color: white !important; color: black !important; }
          @page { size: A4 portrait; margin: 20mm; }
        }
      `}} />

      <div className="bg-white min-h-screen text-black p-8 font-sans">
        <div className="max-w-4xl mx-auto">
          {/* Action buttons (hidden on print) */}
          <PrintButton />

          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider">Segue-me</h1>
            <h2 className="text-xl font-semibold mt-1">Prestação de Contas</h2>
            <p className="text-gray-600 mt-1">{periodText}</p>
            <p className="text-gray-500 text-sm mt-1">Data de Emissão: {format(new Date(), 'dd/MM/yyyy')}</p>
          </div>

          {/* Initial Balance */}
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded font-bold text-lg mb-6 border border-gray-300">
            <span>Saldo Inicial</span>
            <span>{formatCurrency(initialBalance)}</span>
          </div>

          {/* Incomes Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2 uppercase text-green-800 border-b border-green-800 pb-1">1. Entradas (Receitas)</h3>
            <table className="w-full text-left text-sm border-collapse mb-2">
              <thead>
                <tr className="border-b-2 border-gray-400">
                  <th className="py-2 px-2 w-24">Data</th>
                  <th className="py-2 px-2">Histórico</th>
                  <th className="py-2 px-2 text-right w-32">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incomes.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-center italic text-gray-500">Nenhuma entrada no período.</td></tr>
                ) : (
                  incomes.map(t => (
                    <tr key={t.id}>
                      <td className="py-2 px-2">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                      <td className="py-2 px-2">{t.description}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-400 font-bold bg-gray-50">
                  <td colSpan={2} className="py-2 px-2 text-right">Total de Entradas:</td>
                  <td className="py-2 px-2 text-right text-green-700">{formatCurrency(totalIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded font-bold text-lg mb-8 border border-gray-300">
            <span>Subtotal (Saldo Inicial + Entradas)</span>
            <span>{formatCurrency(subTotal)}</span>
          </div>

          {/* Expenses Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2 uppercase text-red-800 border-b border-red-800 pb-1">2. Saídas (Despesas)</h3>
            <table className="w-full text-left text-sm border-collapse mb-2">
              <thead>
                <tr className="border-b-2 border-gray-400">
                  <th className="py-2 px-2 w-24">Data</th>
                  <th className="py-2 px-2">Histórico</th>
                  <th className="py-2 px-2 text-right w-32">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-center italic text-gray-500">Nenhuma saída no período.</td></tr>
                ) : (
                  expenses.map(t => (
                    <tr key={t.id}>
                      <td className="py-2 px-2">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                      <td className="py-2 px-2">{t.description}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-400 font-bold bg-gray-50">
                  <td colSpan={2} className="py-2 px-2 text-right">Total de Saídas:</td>
                  <td className="py-2 px-2 text-right text-red-700">{formatCurrency(totalExpense)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Final Balance */}
          <div className="flex justify-between items-center bg-gray-200 p-4 rounded font-bold text-xl mt-8 border border-gray-400">
            <span>Saldo Final do Período</span>
            <span>{formatCurrency(finalBalance)}</span>
          </div>

          {/* Signatures */}
          <div className="mt-24 grid grid-cols-2 gap-16 text-center" style={{ pageBreakInside: 'avoid' }}>
            <div>
              <div className="border-t border-black pt-2 mx-4">
                <p className="font-bold">Tesoureiro(a)</p>
                <p className="text-sm text-gray-600">Segue-me</p>
              </div>
            </div>
            <div>
              <div className="border-t border-black pt-2 mx-4">
                <p className="font-bold">Coordenador(a)</p>
                <p className="text-sm text-gray-600">Segue-me</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
