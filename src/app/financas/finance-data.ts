import { MonthBalance } from '@prisma/client';
import { getCurrentMonth, getMonths, getTransactions } from '@/app/actions/finance';
import type { TransactionWithAttachments } from '@/types/finance';

export type FinanceSearchParams = {
  [key: string]: string | string[] | undefined;
};

export async function getFinanceViewData(searchParams?: FinanceSearchParams) {
  const currentMonth = await getCurrentMonth();
  const monthsHistory = await getMonths();
  const view = (searchParams?.view as string) || 'monthly';

  const paramMonthId = searchParams?.monthId as string | undefined;
  const activeMonth = paramMonthId
    ? monthsHistory.find((m) => m.id === paramMonthId) ||
      currentMonth ||
      monthsHistory[0]
    : currentMonth || monthsHistory[0];

  if (!activeMonth) {
    return {
      currentMonth,
      monthsHistory,
      activeMonth: null,
      displayMonthBalance: null,
      transactions: [] as TransactionWithAttachments[],
      view,
    };
  }

  let transactions: TransactionWithAttachments[] = [];
  const displayMonthBalance: MonthBalance = { ...activeMonth };

  if (view === 'monthly') {
    transactions = await getTransactions(activeMonth.id);
  } else if (view === 'semiannual') {
    const currentIndex = monthsHistory.findIndex(
      (m) => m.id === activeMonth.id,
    );
    const targetMonths = monthsHistory.slice(currentIndex, currentIndex + 6);
    const allTransactions = await Promise.all(
      targetMonths.map((month) => getTransactions(month.id)),
    );
    transactions = allTransactions.flat();
    displayMonthBalance.initialBalance =
      targetMonths[targetMonths.length - 1]?.initialBalance || 0;
  } else if (view === 'annual') {
    const yearMonths = monthsHistory.filter((m) => m.year === activeMonth.year);
    const allTransactions = await Promise.all(
      yearMonths.map((month) => getTransactions(month.id)),
    );
    transactions = allTransactions.flat();
    displayMonthBalance.initialBalance =
      yearMonths[yearMonths.length - 1]?.initialBalance || 0;
  }

  return {
    currentMonth,
    monthsHistory,
    activeMonth,
    displayMonthBalance,
    transactions,
    view,
  };
}
