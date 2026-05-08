'use server';

import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';

export async function loginAction(password: string) {
  try {
    const APP_PASSWORD = process.env.APP_PASSWORD || 'segueme';

    if (password === APP_PASSWORD) {
      const token = await signToken({ authenticated: true });
      
      // Definir cookie
      const cookieStore = await cookies();
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 horas
      });

      return { success: true };
    }

    return { success: false, error: 'Senha incorreta.' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Ocorreu um erro interno durante a autenticação.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
