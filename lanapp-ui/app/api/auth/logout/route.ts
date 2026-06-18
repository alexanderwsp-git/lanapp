import { NextRequest } from 'next/server';

import { clearAuthCookie, getBearerToken, jsonError, jsonOk } from '@/lib/auth/api-response';
import { cognitoErrorMessage, logout } from '@/lib/auth/cognito-service';

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (token) {
      await logout(token).catch(() => undefined);
    }
    const response = jsonOk({ message: 'Sesión cerrada' });
    clearAuthCookie(response);
    return response;
  } catch (err) {
    return jsonError(cognitoErrorMessage(err), 400);
  }
}
