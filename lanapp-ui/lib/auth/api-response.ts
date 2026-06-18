import { NextResponse } from 'next/server';

export type ApiOk<T> = {
  success: true;
  message: string;
  data: T;
  error: null;
};

export type ApiErr = {
  success: false;
  message: string;
  data: null;
  error: string;
};

export function jsonOk<T>(data: T, message = 'OK', status = 200) {
  return NextResponse.json(
    { success: true, message, data, error: null } satisfies ApiOk<T>,
    { status }
  );
}

export function jsonError(error: string, status = 400, message = 'Request failed') {
  return NextResponse.json(
    { success: false, message, data: null, error } satisfies ApiErr,
    { status }
  );
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export const AUTH_COOKIE = 'lanapp_auth';

export function setAuthCookie(response: NextResponse, maxAgeSeconds = 3600) {
  response.cookies.set(AUTH_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE);
}
