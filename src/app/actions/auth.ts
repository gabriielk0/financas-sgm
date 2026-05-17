'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { AuthPayload, UserProfile, signToken, verifyToken } from '@/lib/auth';

type LoginInput =
  | string
  | {
      email?: string;
      password: string;
      modulo?: UserProfile;
    };

type SessionUser = {
  usuarioId: string;
  nome: string;
  email: string;
  perfil: UserProfile;
  status: string;
};

const SESSION_MAX_AGE = 60 * 60 * 24;
const DEFAULT_FINANCE_EMAIL = 'financas@segueme.local';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split('$');

  if (scheme !== 'scrypt' || !salt || !hash) {
    return false;
  }

  const hashedInput = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, 'hex');

  return (
    storedBuffer.length === hashedInput.length &&
    crypto.timingSafeEqual(storedBuffer, hashedInput)
  );
}

async function setSessionCookie(user: SessionUser) {
  const token = await signToken(user);
  const cookieStore = await cookies();

  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return token;
}

function buildRedirect(perfil: UserProfile) {
  return perfil === 'financas'
    ? '/financas/dashboard'
    : '/reembolso/minhas-solicitacoes';
}

async function loginWithFinanceFallback(password: string) {
  const appPassword = process.env.APP_PASSWORD || 'segueme';

  if (password !== appPassword) {
    return { success: false, error: 'E-mail ou senha incorretos.' };
  }

  const user: SessionUser = {
    usuarioId: 'financas-local',
    nome: 'Finanças',
    email: DEFAULT_FINANCE_EMAIL,
    perfil: 'financas',
    status: 'ativo',
  };

  const token = await setSessionCookie(user);

  return {
    success: true,
    token,
    perfil: user.perfil,
    user,
    redirectTo: buildRedirect(user.perfil),
  };
}

export async function getCurrentSession(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  return verifyToken(token);
}

export async function loginAction(input: LoginInput) {
  try {
    const payload =
      typeof input === 'string'
        ? { password: input, modulo: 'financas' as UserProfile }
        : input;

    const email = payload.email ? normalizeEmail(payload.email) : '';
    const password = payload.password;

    if (!password) {
      return { success: false, error: 'Informe sua senha.' };
    }

    if (!email) {
      return loginWithFinanceFallback(password);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      if (payload.modulo === 'financas') {
        return loginWithFinanceFallback(password);
      }

      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    if (!verifyPassword(password, usuario.senha)) {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    if (usuario.status !== 'ativo') {
      const error =
        usuario.status === 'aguardando_aprovacao'
          ? 'Cadastro enviado. Aguarde aprovação do financeiro.'
          : 'Usuário inativo. Procure a equipe de finanças.';
      return { success: false, error };
    }

    const perfil: UserProfile =
      usuario.perfil === 'financas' ? 'financas' : 'equipe';
    const user: SessionUser = {
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil,
      status: usuario.status,
    };

    const token = await setSessionCookie(user);

    return {
      success: true,
      token,
      perfil,
      user,
      redirectTo: buildRedirect(perfil),
    };
  } catch (error) {
    console.error('Login error:', error);
    if (
      (typeof input === 'string' || input.modulo === 'financas') &&
      (typeof input === 'string' ? input : input.password)
    ) {
      return loginWithFinanceFallback(
        typeof input === 'string' ? input : input.password,
      );
    }

    return {
      success: false,
      error: 'Ocorreu um erro interno durante a autenticação.',
    };
  }
}

type EquipePermitida = (typeof EQUIPES_PERMITIDAS)[number];

const EQUIPES_PERMITIDAS = [
  'Comando',
  'Fichas',
  'Pós-encontro',
  'Montagem',
  'Palestra',
] as const;

export async function cadastroAction(formData: FormData) {
  try {
    const nome = String(formData.get('nome') || '').trim();
    let equipe = String(formData.get('equipe') || '').trim();
    const email = normalizeEmail(String(formData.get('email') || ''));
    const whatsapp = String(formData.get('whatsapp') || '').trim();
    const senha = String(formData.get('senha') || '');
    const confirmarSenha = String(formData.get('confirmarSenha') || '');
    const perfilReq = String(formData.get('perfil') || 'equipe');

    if (perfilReq === 'financas') {
      equipe = 'Finanças';
    } else if (!EQUIPES_PERMITIDAS.includes(equipe as EquipePermitida)) {
      return { success: false, error: 'Selecione uma equipe válida.' };
    }

    if (!nome || !equipe || !email || !whatsapp || !senha) {
      return { success: false, error: 'Preencha todos os campos.' };
    }

    if (senha !== confirmarSenha) {
      return { success: false, error: 'As senhas não conferem.' };
    }

    const existing = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        error: 'Já existe um cadastro com este e-mail.',
      };
    }

    await prisma.usuario.create({
      data: {
        nome,
        equipe,
        email,
        whatsapp,
        senha: hashPassword(senha),
        status: 'aguardando_aprovacao',
        perfil: perfilReq === 'financas' ? 'financas' : 'equipe',
      },
    });

    revalidatePath('/financas/usuarios');

    return {
      success: true,
      message: 'Cadastro enviado! Aguarde aprovação.',
    };
  } catch (error) {
    console.error('Cadastro error:', error);
    return { success: false, error: 'Não foi possível enviar o cadastro.' };
  }
}

export async function listarUsuarios() {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') return [];

    return await prisma.usuario.findMany({
      orderBy: { criado_em: 'desc' },
    });
  } catch (error) {
    console.error('Usuarios pending error:', error);
    return [];
  }
}

export async function atualizarUsuarioStatus(
  usuarioId: string,
  status: 'ativo' | 'inativo',
) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') {
      return { success: false, error: 'Acesso negado.' };
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { status },
    });

    // TODO: enviar e-mail automático quando a integração for definida.
    revalidatePath('/financas/usuarios');

    return { success: true };
  } catch (error) {
    console.error('Usuario status error:', error);
    return { success: false, error: 'Não foi possível atualizar o cadastro.' };
  }
}

export async function excluirUsuario(usuarioId: string) {
  try {
    const session = await getCurrentSession();

    if (session?.perfil !== 'financas') {
      return { success: false, error: 'Acesso negado.' };
    }

    await prisma.usuario.delete({
      where: { id: usuarioId },
    });

    revalidatePath('/financas/usuarios');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return { success: false, error: 'Não foi possível excluir o usuário.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
