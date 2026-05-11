import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forbidden, getRequestSession, unauthorized } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) return unauthorized();
  if (session.perfil !== 'financas') return forbidden();

  const usuarios = await prisma.usuario.findMany({
    where: { status: 'aguardando_aprovacao' },
    orderBy: { criado_em: 'asc' },
  });

  return Response.json(usuarios);
}
