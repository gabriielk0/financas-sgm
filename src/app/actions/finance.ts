'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

// ==========================
// MONTH ACTIONS
// ==========================

export async function getMonths() {
  try {
    return await prisma.monthBalance.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  } catch (error: any) {
    console.error('ERRO PRISMA:', error);
    return [];
  }
}

export async function getCurrentMonth() {
  try {
    const months = await prisma.monthBalance.findMany({
      where: { isClosed: false },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 1,
    });
    
    if (months.length > 0) return months[0];

    // First access scenario: create the first month automatically
    const allHistory = await prisma.monthBalance.count();
    if (allHistory === 0) {
      const now = new Date();
      const newMonth = await prisma.monthBalance.create({
        data: {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          initialBalance: 5000, // Saldo inicial padrão
          finalBalance: 5000,
          isClosed: false,
        }
      });
      return newMonth;
    }

    return null;
  } catch (error: any) {
    console.error('ERRO PRISMA:', error);
    return null;
  }
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
  try {
    return await prisma.transaction.findMany({
      where: { monthId },
      orderBy: { date: 'desc' },
    });
  } catch (error: any) {
    console.error('ERRO PRISMA:', error);
    return [];
  }
}

export async function addTransaction(formData: FormData) {
  try {
    const monthId = formData.get('monthId') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as 'IN' | 'OUT';
    const amount = parseFloat(formData.get('amount') as string);
    const dateStr = formData.get('date') as string;
    const status = 'COMPLETED';

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
      return { success: false, error: 'Cannot add transaction to a closed month.' };
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
  } catch (error: any) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro de conexão com o banco de dados.' };
  }
}

export async function updateTransaction(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as 'IN' | 'OUT';
    const amountStr = formData.get('amount') as string;
    const dateStr = formData.get('date') as string;
    const status = formData.get('status') as 'PENDING' | 'COMPLETED';

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { monthBalance: true },
    });

    if (!transaction || transaction.monthBalance.isClosed) {
      return { success: false, error: 'Não é possível editar transação de um mês fechado.' };
    }

    const file = formData.get('file') as File | null;
    let attachmentUrl = transaction.attachmentUrl; // Keep existing if no new file

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Str = buffer.toString('base64');
      const mimeType = file.type;
      attachmentUrl = `data:${mimeType};base64,${base64Str}`;
    }

    const dataToUpdate: any = {};
    if (description) dataToUpdate.description = description;
    if (type) dataToUpdate.type = type;
    if (amountStr) dataToUpdate.amount = parseFloat(amountStr);
    if (dateStr) dataToUpdate.date = new Date(dateStr);
    if (status) dataToUpdate.status = status;
    dataToUpdate.attachmentUrl = attachmentUrl;

    await prisma.transaction.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro de conexão ao atualizar.' };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { monthBalance: true },
    });

    if (!transaction || transaction.monthBalance.isClosed) {
      return { success: false, error: 'Não é possível excluir transação de um mês fechado.' };
    }

    await prisma.transaction.delete({
      where: { id },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro de conexão ao excluir.' };
  }
}
