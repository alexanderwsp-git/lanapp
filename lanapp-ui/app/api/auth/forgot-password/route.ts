import { NextRequest } from 'next/server';

import { jsonError, jsonOk } from '@/lib/auth/api-response';
import { cognitoErrorMessage, forgotPassword } from '@/lib/auth/cognito-service';
import { isSkipAuthEnabled } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string };
    const username = body.username?.trim();
    if (!username) {
      return jsonError('Email o usuario requerido', 400);
    }

    if (isSkipAuthEnabled()) {
      return jsonOk(
        {},
        'Si el usuario existe, enviamos un código de recuperación a su email (modo dev)'
      );
    }

    await forgotPassword(username);
    return jsonOk(
      {},
      'Si el usuario existe, enviamos un código de recuperación a su email'
    );
  } catch (err) {
    return jsonError(cognitoErrorMessage(err), 400);
  }
}
