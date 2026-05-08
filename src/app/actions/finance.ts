'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

// ==========================
// ACOES DE MES
// ==========================

export async function getMonths() {
  try {
    return await prisma.monthBalance.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  } catch (error: unknown) {
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

    // Cenário de primeiro acesso: criar o primeiro mês automaticamente
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
  } catch (error: unknown) {
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
   return { success: false, error: 'Mês não encontrado ou já está fechado.' };
  }

  // Calcular saldo final dinamicamente com base nas transações concluídas
  const totalIn = currentMonth.transactions
    .filter((t) => t.type === 'IN' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = currentMonth.transactions
    .filter((t) => t.type === 'OUT' && t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const finalBalance = currentMonth.initialBalance + totalIn - totalOut;

  // Determinar próximo mês e ano
  let nextMonthNumber = currentMonth.month + 1;
  let nextYear = currentMonth.year;
  if (nextMonthNumber > 12) {
    nextMonthNumber = 1;
    nextYear++;
  }

  try {
    // Transação para fechar o mês atual e abrir o próximo
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
  } catch (error: unknown) {
    console.error('ERRO AO FECHAR MÊS:', error);
    return { success: false, error: 'Não foi possível fechar o mês. Verifique se já existe um mês aberto para o período seguinte.' };
  }
}

export async function reopenMonth(monthId: string) {
  try {
    const month = await prisma.monthBalance.findUnique({
      where: { id: monthId },
    });
    
    if (!month || !month.isClosed) {
      return { success: false, error: 'Mês não encontrado ou já está aberto.' };
    }

    // Identificar o próximo mês
    let nextMonthNumber = month.month + 1;
    let nextYear = month.year;
    if (nextMonthNumber > 12) {
      nextMonthNumber = 1;
      nextYear++;
    }

    // Verificar se o próximo mês existe e possui transações
    const nextMonth = await prisma.monthBalance.findUnique({
      where: { month_year: { month: nextMonthNumber, year: nextYear } },
      include: { transactions: true }
    });

    if (nextMonth) {
      if (nextMonth.isClosed) {
        return { success: false, error: 'Não é possível reabrir este mês pois o mês seguinte também já foi fechado.' };
      }
      if (nextMonth.transactions.length > 0) {
        return { success: false, error: 'Não é possível reabrir este mês pois o mês seguinte já possui transações. Exclua ou mova as transações do mês seguinte primeiro.' };
      }
      
      // Excluir o próximo mês porque está vazio
      await prisma.$transaction([
        prisma.monthBalance.delete({
          where: { id: nextMonth.id }
        }),
        prisma.monthBalance.update({
          where: { id: monthId },
          data: { isClosed: false }
        })
      ]);
    } else {
      // Apenas reabrir
      await prisma.monthBalance.update({
        where: { id: monthId },
        data: { isClosed: false }
      });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro ao reabrir mês.' };
  }
}

// ==========================
// ACOES DE TRANSACAO
// ==========================

export async function getTransactions(monthId: string) {
  try {
    return await prisma.transaction.findMany({
      where: { monthId },
      orderBy: { date: 'desc' },
    });
  } catch (error: unknown) {
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
    
    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
  return { success: false, error: 'Por favor, insira uma data válida.' };
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
  } catch (error: unknown) {
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
    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
  return { success: false, error: 'Por favor, insira uma data válida.' };
}

    if (!transaction || transaction.monthBalance.isClosed) {
      return { success: false, error: 'Não é possível editar transação de um mês fechado.' };
    }

    const file = formData.get('file') as File | null;
    let attachmentUrl = transaction.attachmentUrl; // Manter o atual se não houver novo arquivo

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Str = buffer.toString('base64');
      const mimeType = file.type;
      attachmentUrl = `data:${mimeType};base64,${base64Str}`;
    }

    const dataToUpdate: Record<string, unknown> = {};
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
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro de conexão ao atualizar.' };
  }
}

export async function completePayment(id: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { monthBalance: true },
    });

    if (!transaction || transaction.monthBalance.isClosed) {
      return { success: false, error: 'Não é possível alterar transação de um mês fechado.' };
    }

    await prisma.transaction.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro de conexão ao excluir.' };
  }
}
