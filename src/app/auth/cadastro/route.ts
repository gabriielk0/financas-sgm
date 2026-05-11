import type { NextRequest } from 'next/server';
import { cadastroAction } from '@/app/actions/auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const formData = new FormData();

  for (const key of [
    'nome',
    'equipe',
    'email',
    'whatsapp',
    'senha',
    'confirmarSenha',
  ]) {
    formData.set(key, String(body[key] || ''));
  }

  const result = await cadastroAction(formData);

  return Response.json(result, { status: result.success ? 201 : 400 });
}
