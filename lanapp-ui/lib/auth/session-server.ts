import { rolesFromGroups } from './constants';
import {
  getUserAttributesFromAccessToken,
  verifyAccessToken,
} from './cognito-service';
import type { SessionUser } from './session';

export async function getUserFromAccessToken(
  accessToken: string
): Promise<SessionUser | null> {
  try {
    const payload = await verifyAccessToken(accessToken);
    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];

    let email = (payload.email as string) || '';
    let username =
      (payload.username as string) ||
      (payload['cognito:username'] as string) ||
      (payload.sub as string);
    let preferredUsername: string | null =
      (payload.preferred_username as string | undefined) ?? null;

    try {
      const attrs = await getUserAttributesFromAccessToken(accessToken);
      email = attrs.email || email;
      username = attrs.username || username;
      preferredUsername = attrs.preferredUsername ?? preferredUsername;
    } catch {
      // GetUser may fail in dev; JWT claims are enough as fallback
    }

    return {
      username,
      email,
      preferredUsername,
      groups,
      roles: rolesFromGroups(groups),
    };
  } catch {
    return null;
  }
}
