import type { NextRequest } from 'next/server';
import { loginAction } from '@/app/actions/auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const result = await loginAction({
    email: String(body.email || ''),
    password: String(body.senha || body.password || ''),
    modulo: body.modulo === 'financas' ? 'financas' : 'equipe',
  });

  return Response.json(result, { status: result.success ? 200 : 401 });
}
