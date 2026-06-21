'use client';

import { useCallback, useEffect, useState } from 'react';

import { displayName, userInitials, shortDisplayName } from './display-user';
import { getAccessToken, devSessionUser, isSkipAuthEnabled, type SessionUser } from './session';

export type AuthUser = SessionUser & {
  displayName: string;
  initials: string;
  shortName: string;
};

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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
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
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
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

  return { user, loading, error, refetch: fetchUser };
}
