import { jwtVerify, SignJWT, JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const key = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}
