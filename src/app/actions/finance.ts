'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { getCurrentSession } from './auth';
import { Prisma } from '@prisma/client';

async function uploadFileToStorage(path: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(path, buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.type,
      });
      return blob.url;
    } catch (err) {
      console.warn('Falha no upload do Vercel Blob, utilizando fallback base64:', err);
    }
  }

  // Fallback local/dev quando token do Blob não estiver configurado ou falhar.
  const mimeType = file.type || 'application/octet-stream';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function revalidateFinanceCaches() {
  revalidateTag('financas-months', 'max');
  revalidateTag('financas-transactions', 'max');
}

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
        },
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
    revalidateFinanceCaches();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO AO FECHAR MÊS:', error);
    return {
      success: false,
      error:
        'Não foi possível fechar o mês. Verifique se já existe um mês aberto para o período seguinte.',
    };
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
      include: { transactions: true },
    });

    if (nextMonth) {
      if (nextMonth.isClosed) {
        return {
          success: false,
          error:
            'Não é possível reabrir este mês pois o mês seguinte também já foi fechado.',
        };
      }
      if (nextMonth.transactions.length > 0) {
        return {
          success: false,
          error:
            'Não é possível reabrir este mês pois o mês seguinte já possui transações. Exclua ou mova as transações do mês seguinte primeiro.',
        };
      }

      // Excluir o próximo mês porque está vazio
      await prisma.$transaction([
        prisma.monthBalance.delete({
          where: { id: nextMonth.id },
        }),
        prisma.monthBalance.update({
          where: { id: monthId },
          data: { isClosed: false },
        }),
      ]);
    } else {
      // Apenas reabrir
      await prisma.monthBalance.update({
        where: { id: monthId },
        data: { isClosed: false },
      });
    }

    revalidatePath('/');
    revalidateFinanceCaches();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro ao reabrir mês.' };
  }
}

// ==========================
// ACOES DE TRANSACAO
// ==========================

export async function getTransactions(monthId: string, filters?: {
  search?: string;
  area?: string;
  status?: string;
  type?: string;
  minAmount?: number;
  maxAmount?: number;
}) {
  try {
    const whereClause: Prisma.TransactionWhereInput = { monthId };

    if (filters) {
      if (filters.area) whereClause.area = filters.area;
      if (filters.status) whereClause.status = filters.status;
      if (filters.type) whereClause.type = filters.type;
      
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        whereClause.amount = {};
        if (filters.minAmount !== undefined) whereClause.amount.gte = filters.minAmount;
        if (filters.maxAmount !== undefined) whereClause.amount.lte = filters.maxAmount;
      }

      if (filters.search) {
        whereClause.OR = [
          { description: { contains: filters.search, mode: 'insensitive' } },
          { internalNotes: { contains: filters.search, mode: 'insensitive' } },
          {
            reembolso: {
              is: {
                nome_pagador: { contains: filters.search, mode: 'insensitive' },
              },
            },
          },
          {
            reembolso: {
              is: {
                finalidade: { contains: filters.search, mode: 'insensitive' },
              },
            },
          },
        ];
      }
    }

    return await prisma.transaction.findMany({
      where: whereClause,
      include: { attachments: true, reembolso: true },
      orderBy: { date: 'desc' },
    });
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return [];
  }
}

export async function recalculateChainBalancesFromMonth(startMonthId: string) {
  try {
    const allMonths = await prisma.monthBalance.findMany({
      include: { transactions: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    const startIdx = allMonths.findIndex((m) => m.id === startMonthId);
    if (startIdx === -1) return;

    for (let i = startIdx; i < allMonths.length; i++) {
      const current = allMonths[i];
      const totalIn = current.transactions
        .filter((t) => t.type === 'IN' && t.status === 'COMPLETED')
        .reduce((acc, t) => acc + t.amount, 0);

      const totalOut = current.transactions
        .filter((t) => t.type === 'OUT' && t.status === 'COMPLETED')
        .reduce((acc, t) => acc + t.amount, 0);

      const newFinalBalance = current.initialBalance + totalIn - totalOut;

      await prisma.monthBalance.update({
        where: { id: current.id },
        data: { finalBalance: newFinalBalance },
      });

      if (i + 1 < allMonths.length) {
        allMonths[i + 1].initialBalance = newFinalBalance;
        await prisma.monthBalance.update({
          where: { id: allMonths[i + 1].id },
          data: { initialBalance: newFinalBalance },
        });
      }
    }
  } catch (error) {
    console.error('ERRO AO RECALCULAR SALDOS EM CASCATA:', error);
  }
}

export async function addTransaction(formData: FormData) {
  try {
    const session = await getCurrentSession();
    const monthId = formData.get('monthId') as string;
    const isRetroativo = formData.get('isRetroativo') === 'true';
    const motivoRetroativo = String(formData.get('motivoRetroativo') || '').trim();

    // Regra de segurança: verificar status do mês
    const month = await prisma.monthBalance.findUnique({
      where: { id: monthId },
      select: { id: true, isClosed: true },
    });
    if (!month) {
      return { success: false, error: 'Mês não encontrado.' };
    }

    if (month.isClosed) {
      if (session?.perfil !== 'financas') {
        return {
          success: false,
          error: 'Apenas usuários do financeiro podem realizar lançamentos retroativos em mês fechado.',
        };
      }
      if (!isRetroativo || !motivoRetroativo) {
        return {
          success: false,
          error: 'Para realizar um lançamento em mês fechado, informe o motivo do atraso/lançamento retroativo.',
        };
      }
    }

    const description = formData.get('description') as string;
    const type = formData.get('type') as 'IN' | 'OUT';
    const amount = parseFloat(formData.get('amount') as string);
    const dateStr = formData.get('date') as string;
    const status =
      (formData.get('status') as 'PENDING' | 'COMPLETED') || 'COMPLETED';
    const area = (formData.get('area') as string) || 'Outros';
    const internalNotesInput = formData.get('internalNotes') as string | null;

    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
      return { success: false, error: 'Por favor, insira uma data válida.' };
    }

    let internalNotes = internalNotesInput || undefined;
    if (isRetroativo || motivoRetroativo) {
      const retroTag = `[RETROATIVO] Motivo: ${motivoRetroativo || 'Não especificado'}`;
      internalNotes = internalNotes ? `${retroTag} | ${internalNotes}` : retroTag;
    }

    const createdTransaction = await prisma.transaction.create({
      data: {
        date: new Date(dateStr),
        description,
        type,
        amount,
        status,
        monthId,
        area,
        internalNotes,
      },
    });

    const rawFiles = [
      ...(formData.getAll('files') as File[]),
      formData.get('file') as File | null,
    ];
    const files = rawFiles.filter(
      (file): file is File => !!file && file.size > 0,
    );

    if (files.length > 0) {
      const uploadedAttachments = await Promise.all(
        files.map(async (file) => {
          const url = await uploadFileToStorage(
            `transactions/${createdTransaction.id}/${Date.now()}-${file.name}`,
            file,
          );
          return {
            url,
            filename: file.name,
            transactionId: createdTransaction.id,
          };
        }),
      );

      await prisma.attachment.createMany({
        data: uploadedAttachments,
      });
    }

    if (status === 'COMPLETED' || month.isClosed) {
      await recalculateChainBalancesFromMonth(monthId);
    }

    revalidatePath('/');
    revalidateFinanceCaches();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro de conexão com o banco de dados.' };
  }
}

export async function updateTransaction(formData: FormData) {
  try {
    const id = formData.get('id') as string;

    // Regra de segurança: bloquear imediatamente operações em mês fechado
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { monthBalance: true },
    });
    if (!transaction) {
      return { success: false, error: 'Transação não encontrada.' };
    }
    if (transaction.monthBalance.isClosed) {
      return {
        success: false,
        error: 'Não é possível editar transação de um mês fechado.',
      };
    }

    const description = formData.get('description') as string;
    const type = formData.get('type') as 'IN' | 'OUT';
    const amountStr = formData.get('amount') as string;
    const dateStr = formData.get('date') as string;
    const status = formData.get('status') as 'PENDING' | 'COMPLETED';
    const area = formData.get('area') as string;

    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
      return { success: false, error: 'Por favor, insira uma data válida.' };
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (description) dataToUpdate.description = description;
    if (type) dataToUpdate.type = type;
    if (amountStr) dataToUpdate.amount = parseFloat(amountStr);
    if (dateStr) dataToUpdate.date = new Date(dateStr);
    if (status) dataToUpdate.status = status;
    if (area) dataToUpdate.area = area;
    if (formData.has('internalNotes')) {
      dataToUpdate.internalNotes = formData.get('internalNotes') as string;
    }

    await prisma.transaction.update({
      where: { id },
      data: dataToUpdate,
    });

    const rawFiles = [
      ...(formData.getAll('files') as File[]),
      formData.get('file') as File | null,
    ];
    const files = rawFiles.filter(
      (file): file is File => !!file && file.size > 0,
    );

    if (files.length > 0) {
      const uploadedAttachments = await Promise.all(
        files.map(async (file) => {
          const url = await uploadFileToStorage(
            `transactions/${id}/${Date.now()}-${file.name}`,
            file,
          );
          return {
            url,
            filename: file.name,
            transactionId: id,
          };
        }),
      );

      await prisma.attachment.createMany({
        data: uploadedAttachments,
      });
    }

    revalidatePath('/');
    revalidateFinanceCaches();
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
      return {
        success: false,
        error: 'Não é possível alterar transação de um mês fechado.',
      };
    }

    await prisma.transaction.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    if (transaction.referenceType === 'reembolso' && transaction.referenceId) {
      const session = await getCurrentSession();
      
      await prisma.reembolso.update({
        where: { id: transaction.referenceId },
        data: { status: 'concluido' }
      });

      await prisma.reembolsoHistory.create({
        data: {
          reembolso_id: transaction.referenceId,
          usuario_id: session?.usuarioId,
          acao: 'PAGO',
          descricao: 'Lançamento financeiro marcado como pago / concluído.',
        }
      });
    } else if (transaction.referenceType === 'pagamento' && transaction.referenceId) {
      const session = await getCurrentSession();
      const pagamentoId = transaction.referenceId;

      const pagamento = await prisma.pagamentoOrcamento.findUnique({
        where: { id: pagamentoId },
      });

      if (pagamento) {
        const targetAmount = pagamento.valor_aprovado ?? pagamento.valor_total;

        // Buscar todas as transações concluídas deste orçamento (incluindo a atual)
        const completedTransactions = await prisma.transaction.findMany({
          where: {
            referenceType: 'pagamento',
            referenceId: pagamentoId,
            OR: [
              { status: 'COMPLETED' },
              { id: transaction.id }
            ]
          }
        });

        const totalPago = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
        const isFullyPaid = totalPago >= targetAmount - 0.01;
        const newStatus = isFullyPaid ? 'pago' : 'pago_parcial';

        await prisma.pagamentoOrcamento.update({
          where: { id: pagamentoId },
          data: { status: newStatus }
        });

        const valorFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount);
        const totalPagoFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago);
        const targetFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(targetAmount);

        await prisma.pagamentoOrcamentoHistory.create({
          data: {
            pagamento_id: pagamentoId,
            usuario_id: session?.usuarioId,
            acao: isFullyPaid ? 'PAGO' : 'PAGAMENTO_PARCIAL',
            descricao: isFullyPaid
              ? `Lançamento financeiro de ${valorFormat} marcado como pago. Valor total quitado (${totalPagoFormat} de ${targetFormat}). Aguardando envio da Nota Fiscal.`
              : `Lançamento de pagamento parcial de ${valorFormat} marcado como pago. Total pago até o momento: ${totalPagoFormat} de ${targetFormat}.`
          }
        });
      }
    }

    revalidatePath('/');
    revalidateFinanceCaches();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro de conexão ao atualizar.' };
  }
}

export async function deleteTransaction(id: string) {
  try {
    // Regra de segurança: bloquear imediatamente operações em mês fechado
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { monthBalance: true },
    });
    if (!transaction) {
      return { success: false, error: 'Transação não encontrada.' };
    }
    if (transaction.monthBalance.isClosed) {
      return {
        success: false,
        error: 'Não é possível excluir transação de um mês fechado.',
      };
    }

    await prisma.transaction.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidateFinanceCaches();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro de conexão ao excluir.' };
  }
}

export async function uploadMonthReport(formData: FormData) {
  try {
    const monthId = formData.get('monthId') as string;
    const file = formData.get('reportFile') as File | null;

    if (!monthId || !file || file.size === 0) {
      return {
        success: false,
        error: 'Informe um arquivo válido para o relatório.',
      };
    }

    const month = await prisma.monthBalance.findUnique({
      where: { id: monthId },
    });

    if (!month) {
      return { success: false, error: 'Mês não encontrado.' };
    }

    const url = await uploadFileToStorage(
      `months/${monthId}/report-${Date.now()}-${file.name}`,
      file,
    );

    await prisma.monthBalance.update({
      where: { id: monthId },
      data: { reportUrl: url },
    });

    revalidatePath('/');
    revalidateFinanceCaches();
    return { success: true, url };
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro ao enviar documento de fechamento.' };
  }
}

export async function addTransactionAttachments(formData: FormData) {
  try {
    const transactionId = formData.get('transactionId') as string;

    if (!transactionId) {
      return { success: false, error: 'Transação não encontrada.' };
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { monthBalance: true },
    });

    if (!transaction) {
      return { success: false, error: 'Transação não encontrada.' };
    }

    const files = (formData.getAll('files') as File[]).filter(
      (file): file is File => !!file && file.size > 0,
    );

    if (files.length === 0) {
      return { success: false, error: 'Nenhum arquivo válido foi enviado.' };
    }

    const uploadedAttachments = await Promise.all(
      files.map(async (file) => {
        const url = await uploadFileToStorage(
          `transactions/${transactionId}/${Date.now()}-${file.name}`,
          file,
        );

        return {
          url,
          filename: file.name,
          transactionId,
        };
      }),
    );

    await prisma.attachment.createMany({
      data: uploadedAttachments,
    });

    revalidatePath('/');
    revalidateFinanceCaches();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro ao anexar arquivos na transação.' };
  }
}

export async function deleteTransactionAttachment(attachmentId: string) {
  try {
    if (!attachmentId) {
      return { success: false, error: 'Anexo não encontrado.' };
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { id: true },
    });

    if (!attachment) {
      return { success: false, error: 'Anexo não encontrado.' };
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    revalidatePath('/');
    revalidateFinanceCaches();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO PRISMA:', error);
    return { success: false, error: 'Erro ao excluir anexo da transação.' };
  }
}
