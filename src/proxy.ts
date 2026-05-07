import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  // If no token and not on login page, redirect to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token exists, verify it
  if (token) {
    const payload = await verifyToken(token);
    if (!payload && !isLoginPage) {
      // Invalid token
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }

    // If valid token and trying to access login page, redirect to home
    if (payload && isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
