import { NextRequest } from 'next/server';

import { getBearerToken, jsonError, jsonOk } from '@/lib/auth/api-response';
import { devSessionUser, isSkipAuthEnabled } from '@/lib/auth/session';
import { getUserFromAccessToken } from '@/lib/auth/session-server';

export async function GET(request: NextRequest) {
  if (isSkipAuthEnabled()) {
    return jsonOk(devSessionUser());
  }

  const token = getBearerToken(request);
  if (!token) {
    return jsonError('Unauthorized', 401);
  }

  const user = await getUserFromAccessToken(token);
  if (!user) {
    return jsonError('Invalid token', 401);
  }

  return jsonOk(user);
}
