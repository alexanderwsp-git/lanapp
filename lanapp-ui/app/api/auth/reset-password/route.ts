import { NextRequest } from 'next/server';

import { jsonError, jsonOk } from '@/lib/auth/api-response';
import { cognitoErrorMessage, resetPassword } from '@/lib/auth/cognito-service';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      code?: string;
      newPassword?: string;
    };

    const username = body.username?.trim();
    const code = body.code?.trim();
    const newPassword = body.newPassword;

    if (!username || !code || !newPassword) {
      return jsonError('Datos incompletos', 400);
    }

    await resetPassword(username, code, newPassword);
    return jsonOk({}, 'Contraseña restablecida. Ya puedes iniciar sesión.');
  } catch (err) {
    return jsonError(cognitoErrorMessage(err), 400);
  }
}
