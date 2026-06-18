import { NextRequest } from 'next/server';

import { getBearerToken } from './api-response';
import { devSessionUser, getUserFromAccessToken, isSkipAuthEnabled } from './session';

export async function requireAdmin(request: NextRequest) {
  if (isSkipAuthEnabled()) {
    return { user: devSessionUser(), error: null };
  }

  const token = getBearerToken(request);
  if (!token) {
    return { user: null, error: 'Unauthorized' as const };
  }

  const user = await getUserFromAccessToken(token);
  if (!user?.roles.includes('admin')) {
    return { user: null, error: 'Forbidden' as const };
  }

  return { user, error: null };
}
