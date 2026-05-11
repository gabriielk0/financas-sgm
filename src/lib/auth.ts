import { jwtVerify, SignJWT, JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const key = new TextEncoder().encode(JWT_SECRET);

export type UserProfile = 'financas' | 'equipe';

export interface AuthPayload extends JWTPayload {
  usuarioId: string;
  nome: string;
  email: string;
  perfil: UserProfile;
  status: string;
}

export async function signToken(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    if (
      typeof payload.usuarioId !== 'string' ||
      typeof payload.nome !== 'string' ||
      typeof payload.email !== 'string' ||
      (payload.perfil !== 'financas' && payload.perfil !== 'equipe') ||
      typeof payload.status !== 'string'
    ) {
      return null;
    }

    return payload as AuthPayload;
  } catch {
    return null;
  }
}
