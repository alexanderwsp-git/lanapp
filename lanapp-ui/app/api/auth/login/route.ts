import { NextRequest } from 'next/server';

import { clearAuthCookie, jsonError, jsonOk, setAuthCookie } from '@/lib/auth/api-response';
import {
  cognitoErrorMessage,
  completeNewPassword,
  loginWithPassword,
} from '@/lib/auth/cognito-service';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim();
    const password = body.password;
    if (!username || !password) {
      return jsonError('Usuario y contraseña son requeridos', 400);
    }

    const result = await loginWithPassword(username, password);

    if (result.challenge === 'NEW_PASSWORD_REQUIRED') {
      return jsonOk(
        {
          challenge: 'NEW_PASSWORD_REQUIRED',
          session: result.session,
          username: result.username,
        },
        'Se requiere nueva contraseña'
      );
    }

    const response = jsonOk(result.tokens, 'Inicio de sesión exitoso');
    setAuthCookie(response, result.tokens.ExpiresIn ?? 3600);
    return response;
  } catch (err) {
    return jsonError(cognitoErrorMessage(err), 401);
  }
}
