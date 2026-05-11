import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentMonth } from '@/app/actions/finance';
import { prisma } from '@/lib/prisma';
import { forbidden, getRequestSession, unauthorized } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);

  if (!session) return unauthorized();

  const { id } = await context.params;
  const reembolso = await prisma.reembolso.findUnique({
    where: { id },
    include: { usuario: true, lancamento: true },
  });

  if (!reembolso) {
    return Response.json({ error: 'Reembolso não encontrado.' }, { status: 404 });
  }

  if (session.perfil !== 'financas' && reembolso.usuario_id !== session.usuarioId) {
    return forbidden();
  }

  return Response.json(reembolso);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);

  if (!session) return unauthorized();
  if (session.perfil !== 'financas') return forbidden();

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (body.status === 'rejeitado') {
    const motivo = String(body.motivo_rejeicao || body.motivo || '').trim();

    if (!motivo) {
      return Response.json(
        { error: 'Informe o motivo da rejeição.' },
        { status: 400 },
      );
    }

    const reembolso = await prisma.reembolso.update({
      where: { id },
      data: { status: 'rejeitado', motivo_rejeicao: motivo },
    });

    revalidatePath('/financas/reembolsos');
    revalidatePath('/reembolso/minhas-solicitacoes');

    return Response.json(reembolso);
  }

  if (body.status !== 'aprovado') {
    return Response.json({ error: 'Status inválido.' }, { status: 400 });
  }

  const reembolso = await prisma.reembolso.findUnique({ where: { id } });

  if (!reembolso || reembolso.status !== 'pendente_reembolso') {
    return Response.json(
      { error: 'Reembolso não encontrado ou não está pendente.' },
      { status: 400 },
    );
  }

  const currentMonth = await getCurrentMonth();

  if (!currentMonth) {
    return Response.json(
      { error: 'Não há um mês financeiro aberto.' },
      { status: 400 },
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const lancamento = await tx.transaction.create({
      data: {
        date: new Date(),
        description: `Reembolso — ${reembolso.descricao} (${reembolso.equipe})`,
        type: 'OUT',
        amount: reembolso.valor,
        status: 'PENDING',
        monthId: currentMonth.id,
        referenceType: 'reembolso',
        referenceId: reembolso.id,
      },
    });

    return tx.reembolso.update({
      where: { id },
      data: { status: 'aprovado', lancamento_id: lancamento.id },
    });
  });

  revalidatePath('/financas/reembolsos');
  revalidatePath('/financas/lancamentos');
  revalidatePath('/financas/dashboard');
  revalidatePath('/reembolso/minhas-solicitacoes');

  return Response.json(result);
}
