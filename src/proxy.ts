import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const publicRoutes = [
  '/',
  '/financas/login',
  '/reembolso/login',
  '/reembolso/cadastro',
];

function redirectByProfile(perfil: 'financas' | 'equipe') {
  return perfil === 'financas'
    ? '/financas/dashboard'
    : '/reembolso/minhas-solicitacoes';
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/financas/login', request.url));
  }

  if (pathname === '/report') {
    return NextResponse.redirect(new URL('/financas/report', request.url));
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  const isFinancasRoute = pathname === '/financas' || pathname.startsWith('/financas/');
  const isReembolsoRoute =
    pathname === '/reembolso' || pathname.startsWith('/reembolso/');
  const isProtectedModuleRoute =
    (isFinancasRoute || isReembolsoRoute) && !isPublicRoute;

  const token = request.cookies.get('auth_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (token && !payload) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  if (payload && (pathname === '/financas/login' || pathname === '/reembolso/login')) {
    return NextResponse.redirect(
      new URL(redirectByProfile(payload.perfil), request.url),
    );
  }

  if (!isProtectedModuleRoute) {
    return NextResponse.next();
  }

  if (!payload) {
    const loginPath = isFinancasRoute ? '/financas/login' : '/reembolso/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (isFinancasRoute && payload.perfil !== 'financas') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isReembolsoRoute && payload.perfil !== 'equipe') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
