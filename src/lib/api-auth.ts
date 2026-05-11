import type { NextRequest } from 'next/server';
import { AuthPayload, verifyToken } from './auth';

export async function getRequestSession(
  request: NextRequest,
): Promise<AuthPayload | null> {
  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;
  const cookieToken = request.cookies.get('auth_token')?.value;
  const token = bearerToken || cookieToken;

  if (!token) return null;

  return verifyToken(token);
}

export function forbidden() {
  return Response.json({ error: 'Acesso negado.' }, { status: 403 });
}

export function unauthorized() {
  return Response.json({ error: 'Não autenticado.' }, { status: 401 });
}
