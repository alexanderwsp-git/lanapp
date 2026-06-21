import {
  clearSession,
  getRefreshToken,
  getTokenUsername,
  isSkipAuthEnabled,
  isTokenExpiredOrExpiring,
  storeTokens,
} from './session';

let refreshInFlight: Promise<boolean> | null = null;

type AuthEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
};

async function authFetch<T>(path: string, init?: RequestInit): Promise<AuthEnvelope<T>> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = (await res.json()) as AuthEnvelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  return body;
}

export type LoginResult =
  | { type: 'tokens'; tokens: { AccessToken: string; RefreshToken?: string; IdToken?: string; ExpiresIn?: number } }
  | { type: 'new_password'; session: string; username: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  const body = await authFetch<{
    challenge?: string;
    session?: string;
    username?: string;
    AccessToken?: string;
    RefreshToken?: string;
    IdToken?: string;
    ExpiresIn?: number;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  const data = body.data;
  if (data.challenge === 'NEW_PASSWORD_REQUIRED' && data.session && data.username) {
    return { type: 'new_password', session: data.session, username: data.username };
  }

  const tokens = {
    AccessToken: data.AccessToken!,
    RefreshToken: data.RefreshToken,
    IdToken: data.IdToken,
    ExpiresIn: data.ExpiresIn,
  };
  storeTokens(tokens);
  if (typeof window !== 'undefined') {
    localStorage.setItem('tokenUsername', username);
  }
  return { type: 'tokens', tokens };
}

export async function setNewPassword(username: string, newPassword: string, session: string) {
  const body = await authFetch<{
    AccessToken: string;
    RefreshToken?: string;
    IdToken?: string;
    ExpiresIn?: number;
  }>('/api/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ username, newPassword, session }),
  });
  storeTokens(body.data);
  if (typeof window !== 'undefined') {
    localStorage.setItem('tokenUsername', username);
  }
}

export async function forgotPassword(username: string) {
  await authFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function resetPassword(username: string, code: string, newPassword: string) {
  await authFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ username, code, newPassword }),
  });
}

export async function refreshSession(): Promise<boolean> {
  if (isSkipAuthEnabled()) return true;

  const username = getTokenUsername();
  const refreshToken = getRefreshToken();
  if (!username || !refreshToken) return false;

  try {
    const body = await authFetch<{
      AccessToken: string;
      RefreshToken?: string;
      IdToken?: string;
      ExpiresIn?: number;
    }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ username, refreshToken }),
    });
    storeTokens({
      AccessToken: body.data.AccessToken,
      RefreshToken: body.data.RefreshToken ?? refreshToken,
      IdToken: body.data.IdToken,
      ExpiresIn: body.data.ExpiresIn,
    });
    return true;
  } catch {
    return false;
  }
}

export async function refreshSessionIfNeeded(): Promise<boolean> {
  if (isSkipAuthEnabled()) return true;
  if (!isTokenExpiredOrExpiring()) return true;

  if (!refreshInFlight) {
    refreshInFlight = refreshSession().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function forceLogout(nextPath?: string) {
  if (typeof window === 'undefined') return;
  await logout();
  const next = nextPath ?? `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}

export async function logout() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => undefined);
  clearSession();
}
