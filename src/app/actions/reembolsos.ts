'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentMonth } from './finance';
import { getCurrentSession } from './auth';
import { put } from '@vercel/blob';
import { Prisma } from '@prisma/client';
import { reembolsoSchema } from '@/lib/validations';

async function uploadFileToStorage(usuario_id: string, file: File | null) {
  if (!file || file.size === 0) return '';

  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const timestamp = Date.now();
    const path = `reembolsos/${usuario_id}/${timestamp}-${file.name}`;

    const blob = await put(path, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    return blob.url;
  }

  // Fallback local/dev quando token do Blob não estiver configurado.
  const mimeType = file.type || 'application/octet-stream';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function revalidateReembolsoViews() {
  revalidatePath('/pagamentos/minhas-solicitacoes');
  revalidatePath('/financas/reembolsos');
  revalidatePath('/financas/lancamentos');
  revalidatePath('/financas/dashboard');
  revalidateTag('financas-transactions', 'max');
}

export async function solicitarReembolso(formData: FormData) {
  try {
    const session = await getCurrentSession();

    if (!session || session.perfil !== 'equipe') {
      return { success: false, error: 'Faça login para solicitar reembolso.' };
    }

    const nome_pagador = String(formData.get('nome_pagador') || '').trim();
    const equipe = String(formData.get('equipe') || '').trim();
    const descricao = String(formData.get('descricao') || '').trim();
    const finalidade = String(formData.get('finalidade') || '').trim();
    const valor = Number.parseFloat(String(formData.get('valor') || '0'));
    const chave_pix = String(formData.get('chave_pix') || '').trim();
    const file = formData.get('file') as File | null;

    const rawData = {
      nome_pagador,
      equipe,
      descricao,
      finalidade,
      valor,
      chave_pix,
    };

    const validation = reembolsoSchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const anexo_url = await uploadFileToStorage(session.usuarioId, file);

    const reembolso = await prisma.reembolso.create({
      data: {
        usuario_id: session.usuarioId,
        nome_pagador,
        equipe,
        descricao,
        finalidade,
        valor,
        chave_pix,
        anexo_url,
        status: 'pendente_reembolso',
      },
    });

    await prisma.reembolsoHistory.create({
      data: {
        reembolso_id: reembolso.id,
        usuario_id: session.usuarioId,
        acao: 'CRIADO',
        descricao: 'Solicitação de reembolso criada e enviada para análise.',
      }
    });

    revalidateReembolsoViews();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO AO SOLICITAR REEMBOLSO:', error);
    const message =
      error instanceof Error ? error.message : 'Desconhecido';
    return {
      success: false,
      error: `Erro ao solicitar o reembolso: ${message}`,
    };
  }
}

export async function listarMinhasSolicitacoes() {
  try {
    const session = await getCurrentSession();

    if (!session || session.perfil !== 'equipe') return [];

    return await prisma.reembolso.findMany({
      where: { usuario_id: session.usuarioId },
      include: {
        historico: {
          orderBy: { criado_em: 'asc' },
        },
        lancamento: true,
      },
      orderBy: { criado_em: 'desc' },
    });
  } catch (error) {
    console.error('ERRO AO LISTAR MINHAS SOLICITAÇÕES:', error);
    return [];
  }
}

export async function listarReembolsosFinanceiro(filtros?: {
  busca?: string;
  status?: string;
  equipe?: string;
}) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') return [];

    const whereClause: Prisma.ReembolsoWhereInput = {};
    if (filtros?.status) whereClause.status = filtros.status;
    if (filtros?.equipe) whereClause.equipe = filtros.equipe;
    if (filtros?.busca) {
      whereClause.OR = [
        { nome_pagador: { contains: filtros.busca, mode: 'insensitive' } },
        { descricao: { contains: filtros.busca, mode: 'insensitive' } },
        { finalidade: { contains: filtros.busca, mode: 'insensitive' } },
        { usuario: { nome: { contains: filtros.busca, mode: 'insensitive' } } }
      ];
    }

    return await prisma.reembolso.findMany({
      where: whereClause,
      include: { 
        usuario: true,
        historico: { orderBy: { criado_em: 'asc' } },
        lancamento: true 
      },
      orderBy: { criado_em: 'desc' },
    });
  } catch (error) {
    console.error('ERRO AO LISTAR REEMBOLSOS:', error);
    return [];
  }
}

export async function contarReembolsosPendentes() {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') return 0;

    return await prisma.reembolso.count({
      where: { status: 'pendente_reembolso' },
    });
  } catch (error) {
    console.error('ERRO AO CONTAR REEMBOLSOS:', error);
    return 0;
  }
}

export async function aprovarReembolso(
  reembolsoId: string, 
  valorAprovado?: number, 
  justificativa?: string
) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') {
      return { success: false, error: 'Acesso negado.' };
    }

    const reembolso = await prisma.reembolso.findUnique({
      where: { id: reembolsoId },
    });

    if (!reembolso || reembolso.status !== 'pendente_reembolso') {
      return {
        success: false,
        error: 'Reembolso não encontrado ou não está pendente.',
      };
    }

    const currentMonth = await getCurrentMonth();

    if (!currentMonth) {
      return {
        success: false,
        error: 'Não há um mês financeiro aberto para realizar o lançamento.',
      };
    }

    await prisma.$transaction(async (tx) => {
      const valorFinal = valorAprovado !== undefined && valorAprovado >= 0 ? valorAprovado : reembolso.valor;

      const transaction = await tx.transaction.create({
        data: {
          date: new Date(),
          description: `Reembolso — ${reembolso.descricao} (${reembolso.equipe})`,
          type: 'OUT',
          amount: valorFinal,
          status: 'PENDING',
          monthId: currentMonth.id,
          referenceType: 'reembolso',
          referenceId: reembolso.id,
          attachments: {
            create: {
              url: reembolso.anexo_url,
              filename: `Comprovante - ${reembolso.descricao}`,
            }
          }
        },
      });

      await tx.reembolso.update({
        where: { id: reembolsoId },
        data: { 
          status: 'aprovado', 
          lancamento_id: transaction.id,
          ...(valorAprovado !== undefined && { valor_aprovado: valorFinal }) 
        },
      });

      if (valorAprovado !== undefined && valorAprovado !== reembolso.valor) {
        await tx.reembolsoHistory.create({
          data: {
            reembolso_id: reembolsoId,
            usuario_id: session.usuarioId,
            acao: 'VALOR_ALTERADO',
            descricao: `Valor alterado de R$ ${reembolso.valor} para R$ ${valorAprovado}. Justificativa: ${justificativa || 'Nenhuma justificativa informada.'}`,
          }
        });
      }

      await tx.reembolsoHistory.create({
        data: {
          reembolso_id: reembolsoId,
          usuario_id: session.usuarioId,
          acao: 'APROVADO',
          descricao: 'Reembolso aprovado pelo financeiro e convertido em lançamento.',
        }
      });
    });

    revalidateReembolsoViews();
    return { success: true };
  } catch (error) {
    console.error('ERRO AO APROVAR REEMBOLSO:', error);
    return { success: false, error: 'Erro ao aprovar o reembolso.' };
  }
}

export async function rejeitarReembolso(reembolsoId: string, motivo: string) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') {
      return { success: false, error: 'Acesso negado.' };
    }

    const motivo_rejeicao = motivo.trim();

    if (!motivo_rejeicao) {
      return { success: false, error: 'Informe o motivo da rejeição.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.reembolso.update({
        where: { id: reembolsoId },
        data: { status: 'rejeitado', motivo_rejeicao },
      });

      await tx.reembolsoHistory.create({
        data: {
          reembolso_id: reembolsoId,
          usuario_id: session.usuarioId,
          acao: 'REJEITADO',
          descricao: `Solicitação rejeitada. Motivo: ${motivo_rejeicao}`,
        }
      });
    });

    revalidateReembolsoViews();
    return { success: true };
  } catch (error) {
    console.error('ERRO AO REJEITAR REEMBOLSO:', error);
    return { success: false, error: 'Erro ao rejeitar o reembolso.' };
  }
}

