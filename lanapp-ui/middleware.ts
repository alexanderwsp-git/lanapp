import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SKIP = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true';
const AUTH_COOKIE = 'lanapp_auth';

const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/register',
];

const PUBLIC_API = ['/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/set-password'];

export function middleware(request: NextRequest) {
  if (SKIP) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = request.cookies.get(AUTH_COOKIE)?.value === '1';

  if (!hasSession && !isPublic) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
