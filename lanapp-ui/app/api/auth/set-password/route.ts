import { NextRequest } from 'next/server';

import { jsonError, jsonOk, setAuthCookie } from '@/lib/auth/api-response';
import { cognitoErrorMessage, completeNewPassword } from '@/lib/auth/cognito-service';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      newPassword?: string;
      session?: string;
    };

    const username = body.username?.trim();
    const newPassword = body.newPassword;
    const session = body.session;

    if (!username || !newPassword || !session) {
      return jsonError('Datos incompletos', 400);
    }

    const tokens = await completeNewPassword(username, newPassword, session);
    const response = jsonOk(tokens, 'Contraseña actualizada');
    setAuthCookie(response, tokens.ExpiresIn ?? 3600);
    return response;
  } catch (err) {
    return jsonError(cognitoErrorMessage(err), 400);
  }
}
