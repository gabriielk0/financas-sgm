'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/app/actions/auth';

export type ReportFilters = {
  startDate?: Date;
  endDate?: Date;
  equipe?: string;
  status?: string;
  usuarioId?: string;
};

// 1. Relatório de Reembolsos
export async function getReembolsoReportData(filters: ReportFilters) {
  const session = await getCurrentSession();
  if (session?.perfil !== 'financas') throw new Error('Acesso negado');

  const whereClause: any = {};
  if (filters.startDate || filters.endDate) {
    whereClause.criado_em = {};
    if (filters.startDate) whereClause.criado_em.gte = filters.startDate;
    if (filters.endDate) whereClause.criado_em.lte = filters.endDate;
  }
  if (filters.equipe) whereClause.equipe = filters.equipe;
  if (filters.status) {
    if (filters.status === 'COMPLETED') {
      whereClause.status = { in: ['aprovado', 'pago'] };
    } else if (filters.status === 'PENDING') {
      whereClause.status = 'pendente_reembolso';
    } else {
      whereClause.status = filters.status;
    }
  }
  if (filters.usuarioId) whereClause.usuario_id = filters.usuarioId;

  const reembolsos = await prisma.reembolso.findMany({
    where: whereClause,
    include: { usuario: true },
    orderBy: { criado_em: 'desc' },
  });

  // Métricas
  const totalSolicitado = reembolsos.reduce((acc, r) => acc + r.valor, 0);
  const aprovados = reembolsos.filter(r => r.status === 'aprovado' || r.status === 'pago');
  const totalAprovado = aprovados.reduce((acc, r) => acc + (r.valor_aprovado ?? r.valor), 0);
  
  const pagos = reembolsos.filter(r => r.status === 'pago');
  const totalPago = pagos.reduce((acc, r) => acc + (r.valor_aprovado ?? r.valor), 0);

  const rejeitados = reembolsos.filter(r => r.status === 'rejeitado');
  const totalRejeitado = rejeitados.reduce((acc, r) => acc + r.valor, 0);

  // Agrupamento por Equipe
  const porEquipe = reembolsos.reduce((acc: any, r) => {
    if (!acc[r.equipe]) {
      acc[r.equipe] = { equipe: r.equipe, count: 0, totalSolicitado: 0, totalAprovado: 0 };
    }
    acc[r.equipe].count += 1;
    acc[r.equipe].totalSolicitado += r.valor;
    if (r.status === 'aprovado' || r.status === 'pago') {
      acc[r.equipe].totalAprovado += (r.valor_aprovado ?? r.valor);
    }
    return acc;
  }, {});

  return {
    kpis: {
      quantidade: reembolsos.length,
      totalSolicitado,
      totalAprovado,
      totalPago,
      totalRejeitado,
      mediaValor: reembolsos.length > 0 ? totalSolicitado / reembolsos.length : 0,
    },
    porEquipe: Object.values(porEquipe).sort((a: any, b: any) => b.totalSolicitado - a.totalSolicitado),
    lista: reembolsos,
  };
}

// 2. Relatório por Áreas/Equipes (Baseado nas transações OUT - Saídas)
export async function getTeamReportData(filters: ReportFilters) {
  const session = await getCurrentSession();
  if (session?.perfil !== 'financas') throw new Error('Acesso negado');

  const whereClause: any = { type: 'OUT' };
  
  if (filters.startDate || filters.endDate) {
    whereClause.date = {};
    if (filters.startDate) whereClause.date.gte = filters.startDate;
    if (filters.endDate) whereClause.date.lte = filters.endDate;
  }
  if (filters.equipe) whereClause.area = filters.equipe;

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
  });

  const totalGeral = transactions.reduce((acc, t) => acc + t.amount, 0);

  const porArea = transactions.reduce((acc: any, t) => {
    const area = t.area || 'Outros';
    if (!acc[area]) {
      acc[area] = { area, totalGasto: 0, quantidade: 0, concluido: 0, pendente: 0 };
    }
    acc[area].quantidade += 1;
    acc[area].totalGasto += t.amount;
    if (t.status === 'COMPLETED') acc[area].concluido += t.amount;
    else acc[area].pendente += t.amount;
    return acc;
  }, {});

  const ranking = Object.values(porArea).map((a: any) => ({
    ...a,
    percentual: totalGeral > 0 ? (a.totalGasto / totalGeral) * 100 : 0,
  })).sort((a, b) => b.totalGasto - a.totalGasto);

  return {
    totalGeral,
    quantidadeTotal: transactions.length,
    ranking,
  };
}

// 3. Relatório Consolidado (Geral)
export async function getConsolidatedReportData(filters: ReportFilters) {
  const session = await getCurrentSession();
  if (session?.perfil !== 'financas') throw new Error('Acesso negado');

  const whereClause: any = {};
  if (filters.startDate || filters.endDate) {
    whereClause.date = {};
    if (filters.startDate) whereClause.date.gte = filters.startDate;
    if (filters.endDate) whereClause.date.lte = filters.endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
  });

  const metrics = transactions.reduce((acc, t) => {
    if (t.type === 'IN') {
      acc.entradas += t.amount;
      if (t.status === 'COMPLETED') acc.entradasConcluidas += t.amount;
      else acc.entradasPendentes += t.amount;
    } else {
      acc.saidas += t.amount;
      if (t.status === 'COMPLETED') acc.saidasConcluidas += t.amount;
      else acc.saidasPendentes += t.amount;
    }
    return acc;
  }, {
    entradas: 0, entradasConcluidas: 0, entradasPendentes: 0,
    saidas: 0, saidasConcluidas: 0, saidasPendentes: 0
  });

  const saldoPrevisto = metrics.entradas - metrics.saidas;
  const saldoAtual = metrics.entradasConcluidas - metrics.saidasConcluidas;

  return {
    metrics,
    saldoAtual,
    saldoPrevisto,
    crescimento: null // Seria calculado comparando com período anterior se necessário
  };
}
