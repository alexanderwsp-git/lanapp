import { rolesFromGroups } from './constants';
import { verifyAccessToken } from './cognito-service';
import type { SessionUser } from './session';

export async function getUserFromAccessToken(
  accessToken: string
): Promise<SessionUser | null> {
  try {
    const payload = await verifyAccessToken(accessToken);
    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
    return {
      username:
        (payload.username as string) ||
        (payload['cognito:username'] as string) ||
        (payload.sub as string),
      email: (payload.email as string) || '',
      groups,
      roles: rolesFromGroups(groups),
    };
  } catch {
    return null;
  }
}
