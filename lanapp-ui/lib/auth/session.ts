import { rolesFromGroups } from './constants';
import { verifyAccessToken } from './cognito-service';

export type SessionUser = {
  username: string;
  email: string;
  roles: string[];
  groups: string[];
};

export async function getUserFromAccessToken(
  accessToken: string
): Promise<SessionUser | null> {
  try {
    const payload = await verifyAccessToken(accessToken);
    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
    return {
      username:
        (payload.username as string) ||
        (payload['cognito:username'] as string) ||
        (payload.sub as string),
      email: (payload.email as string) || '',
      groups,
      roles: rolesFromGroups(groups),
    };
  } catch {
    return null;
  }
}

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
  localStorage.setItem('tokenUsername', localStorage.getItem('tokenUsername') || '');
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
