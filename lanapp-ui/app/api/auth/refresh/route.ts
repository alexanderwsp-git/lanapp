import { NextRequest } from 'next/server';

import { jsonError, jsonOk, setAuthCookie } from '@/lib/auth/api-response';
import { cognitoErrorMessage, refreshAccessToken } from '@/lib/auth/cognito-service';
import { isSkipAuthEnabled } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    if (isSkipAuthEnabled()) {
      const response = jsonOk({
        AccessToken: 'dev-access-token',
        RefreshToken: 'dev-refresh-token',
        IdToken: 'dev-id-token',
        ExpiresIn: 3600,
      });
      setAuthCookie(response, 3600);
      return response;
    }

    const body = (await request.json()) as {
      username?: string;
      refreshToken?: string;
    };

    const username = body.username?.trim();
    const refreshToken = body.refreshToken;
    if (!username || !refreshToken) {
      return jsonError('Token de refresco requerido', 400);
    }

    const tokens = await refreshAccessToken(username, refreshToken);
    const response = jsonOk(tokens);
    setAuthCookie(response, tokens.ExpiresIn ?? 3600);
    return response;
  } catch (err) {
    return jsonError(cognitoErrorMessage(err), 401);
  }
}
