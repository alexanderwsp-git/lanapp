import { NextRequest } from 'next/server';

import { jsonError, jsonOk } from '@/lib/auth/api-response';
import { LANAPP_ROLES, type LanappRole } from '@/lib/auth/constants';
import { cognitoErrorMessage, inviteUser, listLanappUsers } from '@/lib/auth/cognito-service';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error === 'Unauthorized') return jsonError('Unauthorized', 401);
  if (error === 'Forbidden') return jsonError('Forbidden', 403);
  if (!user) return jsonError('Unauthorized', 401);

  try {
    const users = await listLanappUsers();
    return jsonOk(users);
  } catch (err) {
    return jsonError(cognitoErrorMessage(err, 'admin'), 500);
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error === 'Unauthorized') return jsonError('Unauthorized', 401);
  if (error === 'Forbidden') return jsonError('Forbidden', 403);
  if (!user) return jsonError('Unauthorized', 401);

  try {
    const body = (await request.json()) as {
      email?: string;
      role?: string;
      preferredUsername?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const role = body.role as LanappRole | undefined;

    if (!email || !role || !LANAPP_ROLES.includes(role)) {
      return jsonError('Email y rol válido son requeridos', 400);
    }

    const created = await inviteUser({
      email,
      role,
      preferredUsername: body.preferredUsername?.trim(),
    });

    return jsonOk(created, 'Invitación enviada por email', 201);
  } catch (err) {
    return jsonError(cognitoErrorMessage(err, 'admin'), 400);
  }
}
