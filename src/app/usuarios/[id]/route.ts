import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { forbidden, getRequestSession, unauthorized } from '@/lib/api-auth';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);

  if (!session) return unauthorized();
  if (session.perfil !== 'financas') return forbidden();

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const status = body.status === 'inativo' ? 'inativo' : 'ativo';
  const usuario = await prisma.usuario.update({
    where: { id },
    data: { status },
  });

  // TODO: enviar e-mail automático quando a integração for definida.
  revalidatePath('/financas/usuarios');

  return Response.json(usuario);
}
