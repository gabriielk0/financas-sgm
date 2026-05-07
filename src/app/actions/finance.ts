'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// ==========================
// MONTH ACTIONS
// ==========================

export async function getMonths() {
  return await prisma.monthBalance.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
}

export async function getCurrentMonth() {
  const months = await prisma.monthBalance.findMany({
    where: { isClosed: false },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 1,
  });
  return months[0] || null;
}

export async function closeMonth(monthId: string) {
  const currentMonth = await prisma.monthBalance.findUnique({
    where: { id: monthId },
    include: { transactions: true },
  });

  if (!currentMonth || currentMonth.isClosed) {
    throw new Error('Month not found or already closed.');
  }

  // Calculate final balance dynamically based on completed transactions
  const totalIn = currentMonth.transactions
    .filter((t) => t.type === 'IN' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = currentMonth.transactions
    .filter((t) => t.type === 'OUT' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const finalBalance = currentMonth.initialBalance + totalIn - totalOut;

  // Determine next month and year
  let nextMonthNumber = currentMonth.month + 1;
  let nextYear = currentMonth.year;
  if (nextMonthNumber > 12) {
    nextMonthNumber = 1;
    nextYear++;
  }

  // Transaction to close current and open next
  await prisma.$transaction([
    prisma.monthBalance.update({
      where: { id: monthId },
      data: { isClosed: true, finalBalance },
    }),
    prisma.monthBalance.create({
      data: {
        month: nextMonthNumber,
        year: nextYear,
        initialBalance: finalBalance,
        finalBalance: finalBalance,
        isClosed: false,
      },
    }),
  ]);

  revalidatePath('/');
  return { success: true };
}

// ==========================
// TRANSACTION ACTIONS
// ==========================

export async function getTransactions(monthId: string) {
  return await prisma.transaction.findMany({
    where: { monthId },
    orderBy: { date: 'desc' },
  });
}

export async function addTransaction(formData: FormData) {
  const monthId = formData.get('monthId') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as 'IN' | 'OUT';
  const amount = parseFloat(formData.get('amount') as string);
  const dateStr = formData.get('date') as string;
  const status = 'COMPLETED'; // For now, all are completed

  const file = formData.get('file') as File | null;
  let attachmentUrl = undefined;

  if (file && file.size > 0) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Str = buffer.toString('base64');
    const mimeType = file.type;
    attachmentUrl = `data:${mimeType};base64,${base64Str}`;
  }

  const month = await prisma.monthBalance.findUnique({
    where: { id: monthId },
  });

  if (!month || month.isClosed) {
    throw new Error('Cannot add transaction to a closed month.');
  }

  await prisma.transaction.create({
    data: {
      date: new Date(dateStr),
      description,
      type,
      amount,
      status,
      attachmentUrl,
      monthId,
    },
  });

  revalidatePath('/');
  return { success: true };
}

export async function updateTransaction(
  id: string,
  data: {
    date?: Date;
    description?: string;
    type?: 'IN' | 'OUT';
    amount?: number;
    status?: 'PENDING' | 'COMPLETED';
    attachmentUrl?: string;
  }
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { monthBalance: true },
  });

  if (!transaction || transaction.monthBalance.isClosed) {
    throw new Error('Cannot update transaction in a closed month.');
  }

  await prisma.transaction.update({
    where: { id },
    data,
  });

  revalidatePath('/');
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { monthBalance: true },
  });

  if (!transaction || transaction.monthBalance.isClosed) {
    throw new Error('Cannot delete transaction in a closed month.');
  }

  await prisma.transaction.delete({
    where: { id },
  });

  revalidatePath('/');
  return { success: true };
}
