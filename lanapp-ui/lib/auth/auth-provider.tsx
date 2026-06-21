'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { displayName, shortDisplayName, userInitials } from './display-user';
import {
  devSessionUser,
  getAccessToken,
  isSkipAuthEnabled,
  isTokenExpiredOrExpiring,
  type SessionUser,
} from './session';
import { refreshSessionIfNeeded } from './client';

export type AuthUser = SessionUser & {
  displayName: string;
  initials: string;
  shortName: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function enrichUser(user: SessionUser): AuthUser {
  const input = {
    email: user.email,
    username: user.username,
    preferredUsername: user.preferredUsername,
  };
  return {
    ...user,
    displayName: displayName(input),
    initials: userInitials(input),
    shortName: shortDisplayName(input),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setError(null);

    if (isSkipAuthEnabled()) {
      setUser(enrichUser(devSessionUser()));
      setLoading(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      await refreshSessionIfNeeded();
      const currentToken = getAccessToken();
      if (!currentToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setUser(null);
        setError(body.error || 'No autenticado');
        return;
      }
      setUser(enrichUser(body.data as SessionUser));
    } catch {
      setUser(null);
      setError('Error al cargar sesión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isSkipAuthEnabled()) return;
    const interval = setInterval(() => {
      if (isTokenExpiredOrExpiring(120)) {
        void refreshSessionIfNeeded().then(() => fetchUser());
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAdmin: user?.roles.includes('admin') ?? false,
      refetch: fetchUser,
    }),
    [user, loading, error, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
