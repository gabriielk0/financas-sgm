'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface PrivateRouteProps {
  children: React.ReactNode;
  modulo: 'financas' | 'reembolso';
}

type LocalPayload = {
  exp?: number;
  perfil?: 'financas' | 'equipe';
};

function decodeLocalToken(token: string): LocalPayload | null {
  try {
    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const decoded = window.atob(padded);
    return JSON.parse(decoded) as LocalPayload;
  } catch {
    return null;
  }
}

export default function PrivateRoute({ children, modulo }: PrivateRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedPerfil = localStorage.getItem('perfil') as
      | 'financas'
      | 'equipe'
      | null;

    const loginRoute =
      modulo === 'financas' ? '/financas/login' : '/reembolso/login';

    if (!token) {
      router.replace(loginRoute);
      return;
    }

    const payload = decodeLocalToken(token);
    const isExpired = payload?.exp ? payload.exp * 1000 <= Date.now() : true;
    const perfil = payload?.perfil || storedPerfil;

    if (!payload || isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('perfil');
      localStorage.removeItem('usuario');
      router.replace(loginRoute);
      return;
    }

    const routeMatchesProfile =
      (modulo === 'financas' && perfil === 'financas') ||
      (modulo === 'reembolso' && perfil === 'equipe');

    if (!routeMatchesProfile) {
      router.replace('/');
      return;
    }

    const authorizeTimer = window.setTimeout(() => {
      setIsAuthorized(true);
    }, 0);

    return () => window.clearTimeout(authorizeTimer);
  }, [modulo, pathname, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-sm text-zinc-500">
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}
