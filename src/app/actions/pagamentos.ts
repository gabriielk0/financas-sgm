'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from './auth';
import { getCurrentMonth } from './finance';
import { put } from '@vercel/blob';
import { Prisma } from '@prisma/client';
import { pagamentoSchema } from '@/lib/validations';

async function uploadFileToStorage(usuario_id: string, file: File | null, folder: string = 'orcamentos') {
  if (!file || file.size === 0) return '';

  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const timestamp = Date.now();
    const path = `${folder}/${usuario_id}/${timestamp}-${file.name}`;

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
    const file = formData.get('file') as File | null;

    // Novos campos de Forma de Pagamento
    const metodo_pagamento = String(formData.get('metodo_pagamento') || '').trim();
    const chave_pix = String(formData.get('chave_pix') || '').trim();
    const pix_nome = String(formData.get('pix_nome') || '').trim();
    const pix_banco = String(formData.get('pix_banco') || '').trim();
    const banco = String(formData.get('banco') || '').trim();
    const agencia = String(formData.get('agencia') || '').trim();
    const conta = String(formData.get('conta') || '').trim();
    const cpf_cnpj = String(formData.get('cpf_cnpj') || '').trim();
    const codigo_barras = String(formData.get('codigo_barras') || '').trim();
    const observacoesInput = String(formData.get('observacoes') || '').trim();

    const rawData = {
      descricao,
      finalidade,
      fornecedor,
      equipe,
      valor_total,
      data_vencimento,
      metodo_pagamento: metodo_pagamento as 'pix' | 'transferencia' | 'boleto',
      chave_pix: metodo_pagamento === 'pix' ? chave_pix : undefined,
      pix_nome: metodo_pagamento === 'pix' ? pix_nome : undefined,
      pix_banco: metodo_pagamento === 'pix' ? pix_banco : undefined,
      banco: metodo_pagamento === 'transferencia' ? banco : undefined,
      agencia: metodo_pagamento === 'transferencia' ? agencia : undefined,
      conta: metodo_pagamento === 'transferencia' ? conta : undefined,
      cpf_cnpj: metodo_pagamento === 'transferencia' ? cpf_cnpj : undefined,
      codigo_barras: metodo_pagamento === 'boleto' ? codigo_barras : undefined,
      observacoes: observacoesInput || undefined,
    };

    const validation = pagamentoSchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // Serializa como JSON no campo observacoes
    const observacoes = JSON.stringify({
      metodo_pagamento,
      chave_pix: metodo_pagamento === 'pix' ? chave_pix : '',
      pix_nome: metodo_pagamento === 'pix' ? pix_nome : '',
      pix_banco: metodo_pagamento === 'pix' ? pix_banco : '',
      banco: metodo_pagamento === 'transferencia' ? banco : '',
      agencia: metodo_pagamento === 'transferencia' ? agencia : '',
      conta: metodo_pagamento === 'transferencia' ? conta : '',
      cpf_cnpj: metodo_pagamento === 'transferencia' ? cpf_cnpj : '',
      codigo_barras: metodo_pagamento === 'boleto' ? codigo_barras : '',
      observacoes_adicionais: observacoesInput,
    });

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

    const pagamentos = await prisma.pagamentoOrcamento.findMany({
      where: { usuario_id: session.usuarioId },
      include: {
        historico: {
          orderBy: { criado_em: 'asc' },
        },
        lancamento: true,
      },
      orderBy: { criado_em: 'desc' },
    });

    const pagamentoIds = pagamentos.map(p => p.id);
    const todosLancamentos = await prisma.transaction.findMany({
      where: {
        referenceType: 'pagamento',
        referenceId: { in: pagamentoIds },
      },
      orderBy: { date: 'asc' },
    });

    return pagamentos.map(p => ({
      ...p,
      lancamentos: todosLancamentos.filter(l => l.referenceId === p.id),
    }));
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

    if (!['pago', 'pago_parcial'].includes(pagamento.status)) {
      return { success: false, error: 'O pagamento precisa estar pago para enviar NF.' };
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

    const pagamentos = await prisma.pagamentoOrcamento.findMany({
      where: whereClause,
      include: { 
        usuario: true,
        historico: { orderBy: { criado_em: 'asc' } },
        lancamento: true 
      },
      orderBy: { criado_em: 'desc' },
    });

    const pagamentoIds = pagamentos.map(p => p.id);
    const todosLancamentos = await prisma.transaction.findMany({
      where: {
        referenceType: 'pagamento',
        referenceId: { in: pagamentoIds },
      },
      orderBy: { date: 'asc' },
    });

    return pagamentos.map(p => ({
      ...p,
      lancamentos: todosLancamentos.filter(l => l.referenceId === p.id),
    }));
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

    await prisma.$transaction(async (tx) => {
      const valorFinal = valorAprovado !== undefined && valorAprovado >= 0 ? valorAprovado : pagamento.valor_total;

      await tx.pagamentoOrcamento.update({
        where: { id: pagamentoId },
        data: { 
          status: 'aprovado', 
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
          descricao: 'Solicitação de orçamento aprovada pelo financeiro. Aguardando registro dos pagamentos/parcelas.',
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

export async function registrarPagamentoParcial(
  pagamentoId: string,
  valor: number,
  descricaoPagamento?: string,
  dataPagamento?: string
) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') {
      return { success: false, error: 'Acesso negado.' };
    }

    if (!valor || valor <= 0) {
      return { success: false, error: 'Informe um valor de pagamento válido.' };
    }

    const pagamento = await prisma.pagamentoOrcamento.findUnique({
      where: { id: pagamentoId },
    });

    if (!pagamento || !['aprovado', 'pago_parcial'].includes(pagamento.status)) {
      return {
        success: false,
        error: 'Pagamento não encontrado ou não está em status aprovado ou pago parcial.',
      };
    }

    const currentMonth = await getCurrentMonth();

    if (!currentMonth) {
      return {
        success: false,
        error: 'Não há um mês financeiro aberto para realizar o lançamento.',
      };
    }

    const valorAlvo = pagamento.valor_aprovado ?? pagamento.valor_total;

    // Buscar lançamentos já existentes para este orçamento
    const lancamentosExistentes = await prisma.transaction.findMany({
      where: {
        referenceType: 'pagamento',
        referenceId: pagamentoId,
      },
    });

    const totalLancado = lancamentosExistentes.reduce((acc, t) => acc + t.amount, 0);
    const restante = valorAlvo - totalLancado;

    if (valor > restante + 0.01) {
      const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
      const restanteFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(restante > 0 ? restante : 0);
      return {
        success: false,
        error: `O valor informado (${valorFormatado}) ultrapassa o saldo restante a lançar (${restanteFormatado}).`,
      };
    }

    const date = dataPagamento ? new Date(`${dataPagamento}T12:00:00Z`) : pagamento.data_vencimento;
    const desc = descricaoPagamento?.trim() || `Pagamento Parcial — ${pagamento.fornecedor} - ${pagamento.descricao} (${pagamento.equipe})`;

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          date,
          description: desc,
          type: 'OUT',
          amount: valor,
          status: 'PENDING', // Criado como Pendente no financeiro
          monthId: currentMonth.id,
          referenceType: 'pagamento',
          referenceId: pagamento.id,
          attachments: {
            create: {
              url: pagamento.anexo_orcamento_url,
              filename: `Orçamento - ${pagamento.descricao}`,
            },
          },
        },
      });

      const novoStatus = pagamento.status === 'aprovado' ? 'pago_parcial' : pagamento.status;

      await tx.pagamentoOrcamento.update({
        where: { id: pagamentoId },
        data: {
          status: novoStatus,
          lancamento_id: transaction.id,
        },
      });

      const valorFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
      await tx.pagamentoOrcamentoHistory.create({
        data: {
          pagamento_id: pagamentoId,
          usuario_id: session.usuarioId,
          acao: 'PAGAMENTO_PARCIAL',
          descricao: `Lançamento de pagamento parcial no valor de ${valorFormat} registrado (pendente no financeiro).`,
        },
      });
    });

    revalidatePagamentoViews();
    return { success: true };
  } catch (error: unknown) {
    console.error('ERRO AO REGISTRAR PAGAMENTO PARCIAL:', error);
    const message = error instanceof Error ? error.message : 'Desconhecido';
    return {
      success: false,
      error: `Erro ao registrar pagamento parcial: ${message}`,
    };
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
