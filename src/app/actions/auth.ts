'use server';

import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';

export async function loginAction(password: string) {
  const APP_PASSWORD = process.env.APP_PASSWORD || 'segueme';

  if (password === APP_PASSWORD) {
    const token = await signToken({ authenticated: true });
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return { success: true };
  }

  return { success: false, error: 'Senha incorreta.' };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
