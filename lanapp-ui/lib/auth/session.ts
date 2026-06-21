export type SessionUser = {
  username: string;
  email: string;
  preferredUsername?: string | null;
  roles: string[];
  groups: string[];
};

const SKIP = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true';

export function isSkipAuthEnabled(): boolean {
  return SKIP;
}

export function devSessionUser(): SessionUser {
  return {
    username: 'dev-user',
    email: 'dev@localhost',
    roles: ['admin'],
    groups: ['lanapp_admin'],
  };
}

export function storeTokens(tokens: {
  AccessToken: string;
  RefreshToken?: string;
  IdToken?: string;
  ExpiresIn?: number;
}) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', tokens.AccessToken);
  if (tokens.RefreshToken) localStorage.setItem('refreshToken', tokens.RefreshToken);
  if (tokens.IdToken) localStorage.setItem('idToken', tokens.IdToken);
  if (tokens.ExpiresIn) {
    localStorage.setItem('tokenExpiresAt', String(Date.now() + tokens.ExpiresIn * 1000));
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('tokenExpiresAt');
  localStorage.removeItem('tokenUsername');
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function isAuthenticatedClient(): boolean {
  if (isSkipAuthEnabled()) return true;
  return Boolean(getAccessToken());
}

export function getTokenExpiresAt(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('tokenExpiresAt');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** True if token is missing, expired, or within bufferMs of expiry. */
export function isTokenExpiredOrExpiring(bufferMs = 60_000): boolean {
  if (isSkipAuthEnabled()) return false;
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return !getAccessToken();
  return Date.now() >= expiresAt - bufferMs;
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function getTokenUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tokenUsername');
}
