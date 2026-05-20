'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from './auth';
import { getCurrentMonth } from './finance';
import { put } from '@vercel/blob';
import { Prisma } from '@prisma/client';

async function uploadFileToStorage(usuario_id: string, file: File | null, folder: string = 'orcamentos') {
  if (!file || file.size === 0) return '';

  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const timestamp = Date.now();
    const path = `${folder}/${usuario_id}/${timestamp}-${file.name}`;

    const blob = await put(path, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    return blob.url;
  }

  const mimeType = file.type || 'application/octet-stream';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function revalidatePagamentoViews() {
  revalidatePath('/pagamentos/minhas-solicitacoes');
  revalidatePath('/financas/reembolsos'); // TODO update if there's a finance page for this
  revalidatePath('/financas/lancamentos');
  revalidatePath('/financas/dashboard');
  revalidateTag('financas-transactions', 'max');
}

export async function solicitarPagamento(formData: FormData) {
  try {
    const session = await getCurrentSession();

    if (!session || session.perfil !== 'equipe') {
      return { success: false, error: 'Faça login para solicitar pagamento.' };
    }

    const descricao = String(formData.get('descricao') || '').trim();
    const finalidade = String(formData.get('finalidade') || '').trim();
    const fornecedor = String(formData.get('fornecedor') || '').trim();
    const equipe = String(formData.get('equipe') || '').trim();
    const valor_total = Number.parseFloat(String(formData.get('valor_total') || '0'));
    const data_vencimento = String(formData.get('data_vencimento') || '').trim();
    const observacoes = String(formData.get('observacoes') || '').trim();
    const file = formData.get('file') as File | null;

    if (
      !descricao ||
      !finalidade ||
      !fornecedor ||
      !equipe ||
      !data_vencimento ||
      Number.isNaN(valor_total) ||
      valor_total <= 0
    ) {
      return {
        success: false,
        error: 'Preencha todos os dados obrigatórios do pagamento.',
      };
    }

    if (!file || file.size === 0) {
      return {
        success: false,
        error: 'O anexo do orçamento é obrigatório.',
      };
    }

    const anexo_orcamento_url = await uploadFileToStorage(session.usuarioId, file, 'reembolsos');

    // Make sure data_vencimento is a valid date (timezone fix to middle of day to avoid day shift)
    const vencimentoDate = new Date(`${data_vencimento}T12:00:00Z`);

    const pagamento = await prisma.pagamentoOrcamento.create({
      data: {
        usuario_id: session.usuarioId,
        descricao,
        finalidade,
        fornecedor,
        equipe,
        valor_total,
        data_vencimento: vencimentoDate,
        observacoes,
        anexo_orcamento_url,
        status: 'pendente_aprovacao',
      },
    });

    await prisma.pagamentoOrcamentoHistory.create({
      data: {
        pagamento_id: pagamento.id,
        usuario_id: session.usuarioId,
        acao: 'CRIADO',
        descricao: 'Solicitação de pagamento de orçamento criada e enviada para aprovação.',
      }
    });

    revalidatePagamentoViews();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO AO SOLICITAR PAGAMENTO:', error);
    const message = error instanceof Error ? error.message : 'Desconhecido';
    return {
      success: false,
      error: `Erro ao solicitar o pagamento: ${message}`,
    };
  }
}

export async function listarMeusPagamentos() {
  try {
    const session = await getCurrentSession();

    if (!session || session.perfil !== 'equipe') return [];

    return await prisma.pagamentoOrcamento.findMany({
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
    console.error('ERRO AO LISTAR MEUS PAGAMENTOS:', error);
    return [];
  }
}

export async function enviarNotaFiscal(pagamentoId: string, formData: FormData) {
  try {
    const session = await getCurrentSession();

    if (!session || session.perfil !== 'equipe') {
      return { success: false, error: 'Acesso negado.' };
    }

    const numero_nf = String(formData.get('numero_nf') || '').trim();
    const data_emissao_nf = String(formData.get('data_emissao_nf') || '').trim();
    const file = formData.get('file') as File | null;

    if (!numero_nf || !data_emissao_nf || !file || file.size === 0) {
      return {
        success: false,
        error: 'Preencha todos os dados da nota fiscal, incluindo o arquivo.',
      };
    }

    const pagamento = await prisma.pagamentoOrcamento.findUnique({
      where: { id: pagamentoId }
    });

    if (!pagamento || pagamento.usuario_id !== session.usuarioId) {
      return { success: false, error: 'Pagamento não encontrado ou sem permissão.' };
    }

    if (pagamento.status !== 'pago') {
      return { success: false, error: 'O pagamento precisa estar com status pago para enviar NF.' };
    }

    const anexo_nf_url = await uploadFileToStorage(session.usuarioId, file, 'reembolsos');
    const emissaoDate = new Date(`${data_emissao_nf}T12:00:00Z`);

    await prisma.$transaction(async (tx) => {
      await tx.pagamentoOrcamento.update({
        where: { id: pagamentoId },
        data: {
          numero_nf,
          data_emissao_nf: emissaoDate,
          anexo_nf_url,
          status: 'nf_enviada'
        }
      });

      await tx.pagamentoOrcamentoHistory.create({
        data: {
          pagamento_id: pagamentoId,
          usuario_id: session.usuarioId,
          acao: 'NF_ENVIADA',
          descricao: `Nota fiscal nº ${numero_nf} anexada à solicitação.`
        }
      });
    });

    revalidatePagamentoViews();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO AO ENVIAR NOTA FISCAL:', error);
    const message = error instanceof Error ? error.message : 'Desconhecido';
    return {
      success: false,
      error: `Erro ao enviar a NF: ${message}`,
    };
  }
}

export async function listarPagamentosFinanceiro(filtros?: {
  busca?: string;
  status?: string;
  equipe?: string;
}) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') return [];

    const whereClause: Prisma.PagamentoOrcamentoWhereInput = {};
    if (filtros?.status) {
      if (filtros.status === 'pendente_reembolso') whereClause.status = 'pendente_aprovacao';
      else whereClause.status = filtros.status;
    }
    if (filtros?.equipe) whereClause.equipe = filtros.equipe;
    if (filtros?.busca) {
      whereClause.OR = [
        { descricao: { contains: filtros.busca, mode: 'insensitive' } },
        { finalidade: { contains: filtros.busca, mode: 'insensitive' } },
        { fornecedor: { contains: filtros.busca, mode: 'insensitive' } },
        { usuario: { nome: { contains: filtros.busca, mode: 'insensitive' } } }
      ];
    }

    return await prisma.pagamentoOrcamento.findMany({
      where: whereClause,
      include: { 
        usuario: true,
        historico: { orderBy: { criado_em: 'asc' } },
        lancamento: true 
      },
      orderBy: { criado_em: 'desc' },
    });
  } catch (error) {
    console.error('ERRO AO LISTAR PAGAMENTOS:', error);
    return [];
  }
}

export async function contarPagamentosPendentes() {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') return 0;

    return await prisma.pagamentoOrcamento.count({
      where: { 
        status: { in: ['pendente_aprovacao', 'nf_enviada'] } 
      },
    });
  } catch (error) {
    console.error('ERRO AO CONTAR PAGAMENTOS:', error);
    return 0;
  }
}

export async function aprovarPagamento(
  pagamentoId: string, 
  valorAprovado?: number, 
  justificativa?: string
) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') {
      return { success: false, error: 'Acesso negado.' };
    }

    const pagamento = await prisma.pagamentoOrcamento.findUnique({
      where: { id: pagamentoId },
    });

    if (!pagamento || pagamento.status !== 'pendente_aprovacao') {
      return {
        success: false,
        error: 'Pagamento não encontrado ou não está pendente.',
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
      const valorFinal = valorAprovado !== undefined && valorAprovado >= 0 ? valorAprovado : pagamento.valor_total;

      const transaction = await tx.transaction.create({
        data: {
          date: pagamento.data_vencimento,
          description: `Pagamento — ${pagamento.fornecedor} - ${pagamento.descricao} (${pagamento.equipe})`,
          type: 'OUT',
          amount: valorFinal,
          status: 'PENDING',
          monthId: currentMonth.id,
          referenceType: 'pagamento',
          referenceId: pagamento.id,
          attachments: {
            create: {
              url: pagamento.anexo_orcamento_url,
              filename: `Orçamento - ${pagamento.descricao}`,
            }
          }
        },
      });

      await tx.pagamentoOrcamento.update({
        where: { id: pagamentoId },
        data: { 
          status: 'aprovado', 
          lancamento_id: transaction.id,
          ...(valorAprovado !== undefined && { valor_aprovado: valorFinal }) 
        },
      });

      if (valorAprovado !== undefined && valorAprovado !== pagamento.valor_total) {
        await tx.pagamentoOrcamentoHistory.create({
          data: {
            pagamento_id: pagamentoId,
            usuario_id: session.usuarioId,
            acao: 'VALOR_ALTERADO',
            descricao: `Valor alterado de R$ ${pagamento.valor_total} para R$ ${valorAprovado}. Justificativa: ${justificativa || 'Nenhuma justificativa informada.'}`,
          }
        });
      }

      await tx.pagamentoOrcamentoHistory.create({
        data: {
          pagamento_id: pagamentoId,
          usuario_id: session.usuarioId,
          acao: 'APROVADO',
          descricao: 'Pagamento aprovado pelo financeiro e convertido em lançamento.',
        }
      });
    });

    revalidatePagamentoViews();
    return { success: true };
  } catch (error) {
    console.error('ERRO AO APROVAR PAGAMENTO:', error);
    return { success: false, error: 'Erro ao aprovar o pagamento.' };
  }
}

export async function rejeitarPagamento(pagamentoId: string, motivo: string) {
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
      await tx.pagamentoOrcamento.update({
        where: { id: pagamentoId },
        data: { status: 'rejeitado', motivo_rejeicao },
      });

      await tx.pagamentoOrcamentoHistory.create({
        data: {
          pagamento_id: pagamentoId,
          usuario_id: session.usuarioId,
          acao: 'REJEITADO',
          descricao: `Solicitação rejeitada. Motivo: ${motivo_rejeicao}`,
        }
      });
    });

    revalidatePagamentoViews();
    return { success: true };
  } catch (error) {
    console.error('ERRO AO REJEITAR PAGAMENTO:', error);
    return { success: false, error: 'Erro ao rejeitar o pagamento.' };
  }
}

export async function validarNotaFiscal(pagamentoId: string) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') {
      return { success: false, error: 'Acesso negado.' };
    }

    const pagamento = await prisma.pagamentoOrcamento.findUnique({
      where: { id: pagamentoId },
    });

    if (!pagamento || pagamento.status !== 'nf_enviada') {
      return {
        success: false,
        error: 'Pagamento não encontrado ou NF não foi enviada ainda.',
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.pagamentoOrcamento.update({
        where: { id: pagamentoId },
        data: { status: 'concluido' },
      });

      await tx.pagamentoOrcamentoHistory.create({
        data: {
          pagamento_id: pagamentoId,
          usuario_id: session.usuarioId,
          acao: 'CONCLUIDO',
          descricao: 'Nota Fiscal visualizada e validada pelo financeiro. Fluxo concluído.',
        }
      });
    });

    revalidatePagamentoViews();
    return { success: true };
  } catch (error) {
    console.error('ERRO AO VALIDAR NOTA FISCAL:', error);
    return { success: false, error: 'Erro ao validar a nota fiscal.' };
  }
}
