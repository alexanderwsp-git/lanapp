import { NextRequest } from 'next/server';

import { jsonError, jsonOk } from '@/lib/auth/api-response';
import { cognitoErrorMessage, refreshAccessToken } from '@/lib/auth/cognito-service';

export async function POST(request: NextRequest) {
  try {
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
    return jsonOk(tokens);
  } catch (err) {
    return jsonError(cognitoErrorMessage(err), 401);
  }
}
