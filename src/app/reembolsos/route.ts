import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getRequestSession, unauthorized } from '@/lib/api-auth';

function fakeUploadUrl(file: FormDataEntryValue | null) {
  const filename = file instanceof File ? file.name : 'comprovante.pdf';
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');

  // TODO: integrar Cloudflare R2
  return `/uploads/fake/${Date.now()}-${safeName}`;
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session || session.perfil !== 'equipe') return unauthorized();

  const contentType = request.headers.get('content-type') || '';
  const body = contentType.includes('multipart/form-data')
    ? await request.formData()
    : null;
  const json = body ? null : await request.json().catch(() => ({}));

  const getValue = (key: string) =>
    body ? String(body.get(key) || '') : String(json?.[key] || '');
  const valor = Number.parseFloat(getValue('valor'));

  const reembolso = await prisma.reembolso.create({
    data: {
      usuario_id: session.usuarioId,
      nome_pagador: getValue('nome_pagador'),
      equipe: getValue('equipe'),
      descricao: getValue('descricao'),
      finalidade: getValue('finalidade'),
      valor,
      chave_pix: getValue('chave_pix'),
      anexo_url: fakeUploadUrl(body?.get('file') || null),
      status: 'pendente_reembolso',
    },
  });

  revalidatePath('/pagamentos/minhas-solicitacoes');
  revalidatePath('/financas/reembolsos');

  return Response.json(reembolso, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) return unauthorized();

  const reembolsos = await prisma.reembolso.findMany({
    where:
      session.perfil === 'financas'
        ? {}
        : {
            usuario_id: session.usuarioId,
          },
    include: session.perfil === 'financas' ? { usuario: true } : undefined,
    orderBy: { criado_em: 'desc' },
  });

  return Response.json(reembolsos);
}

