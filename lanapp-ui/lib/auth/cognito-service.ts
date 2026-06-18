import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDisableUserCommand,
  AdminInitiateAuthCommand,
  AdminListGroupsForUserCommand,
  ConfirmForgotPasswordCommand,
  ForgotPasswordCommand,
  GlobalSignOutCommand,
  ListUsersCommand,
  RespondToAuthChallengeCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

import { lanappGroupForRole, rolesFromGroups, type LanappRole } from './constants';
import {
  getCognitoClient,
  mapAuthResult,
  requireCognitoConfig,
  secretHash,
} from './cognito-config';

export class CognitoAuthError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = 'CognitoAuthError';
  }
}

export async function loginWithPassword(username: string, password: string) {
  const { userPoolId, clientId, clientSecret } = requireCognitoConfig();
  const client = getCognitoClient();

  const response = await client.send(
    new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash(username, clientId, clientSecret),
      },
    })
  );

  if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return {
      challenge: 'NEW_PASSWORD_REQUIRED' as const,
      session: response.Session!,
      username,
    };
  }

  if (!response.AuthenticationResult) {
    throw new CognitoAuthError('Authentication failed');
  }

  return {
    challenge: null,
    tokens: mapAuthResult(response.AuthenticationResult),
  };
}

export async function completeNewPassword(
  username: string,
  newPassword: string,
  session: string
) {
  const { clientId, clientSecret } = requireCognitoConfig();
  const client = getCognitoClient();

  const response = await client.send(
    new RespondToAuthChallengeCommand({
      ClientId: clientId,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: session,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: newPassword,
        SECRET_HASH: secretHash(username, clientId, clientSecret),
      },
    })
  );

  if (!response.AuthenticationResult) {
    throw new CognitoAuthError('Failed to set new password');
  }

  return mapAuthResult(response.AuthenticationResult);
}

export async function refreshAccessToken(username: string, refreshToken: string) {
  const { userPoolId, clientId, clientSecret } = requireCognitoConfig();
  const client = getCognitoClient();

  const response = await client.send(
    new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash(username, clientId, clientSecret),
      },
    })
  );

  if (!response.AuthenticationResult) {
    throw new CognitoAuthError('Invalid refresh token');
  }

  return mapAuthResult(response.AuthenticationResult);
}

export async function forgotPassword(username: string) {
  const { clientId, clientSecret } = requireCognitoConfig();
  const client = getCognitoClient();

  await client.send(
    new ForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
      SecretHash: secretHash(username, clientId, clientSecret),
    })
  );
}

export async function resetPassword(
  username: string,
  confirmationCode: string,
  newPassword: string
) {
  const { clientId, clientSecret } = requireCognitoConfig();
  const client = getCognitoClient();

  await client.send(
    new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
      SecretHash: secretHash(username, clientId, clientSecret),
    })
  );
}

export async function logout(accessToken: string) {
  const client = getCognitoClient();
  await client.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
}

export async function verifyAccessToken(accessToken: string) {
  const { userPoolId, clientId } = requireCognitoConfig();
  const verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'access',
  });
  return verifier.verify(accessToken);
}

export async function inviteUser(input: {
  email: string;
  role: LanappRole;
  preferredUsername?: string;
}) {
  const { userPoolId } = requireCognitoConfig();
  const client = getCognitoClient();
  const username = input.email;

  const attributes = [
    { Name: 'email', Value: input.email },
    { Name: 'email_verified', Value: 'true' },
  ];
  if (input.preferredUsername) {
    attributes.push({ Name: 'preferred_username', Value: input.preferredUsername });
  }

  await client.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: attributes,
      DesiredDeliveryMediums: ['EMAIL'],
    })
  );

  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: lanappGroupForRole(input.role),
    })
  );

  return { username, email: input.email, role: input.role };
}

function mapCognitoUser(user: UserType, groups: string[]) {
  const attrs = Object.fromEntries(
    (user.Attributes ?? []).map((a) => [a.Name, a.Value])
  );
  const email = attrs.email ?? user.Username ?? '';
  const roles = rolesFromGroups(groups);

  return {
    id: user.Username ?? '',
    email,
    username: attrs.preferred_username ?? user.Username ?? email,
    roles,
    status: user.Enabled === false ? 'Inactivo' : 'Activo',
    initials: (attrs.preferred_username ?? email)
      .split(/[.\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join(''),
  };
}

export async function listLanappUsers(limit = 60) {
  const { userPoolId } = requireCognitoConfig();
  const client = getCognitoClient();

  const response = await client.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: limit,
    })
  );

  const users = response.Users ?? [];
  const enriched = await Promise.all(
    users.map(async (user) => {
      const username = user.Username!;
      const groupsRes = await client.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: userPoolId,
          Username: username,
        })
      );
      const groups = (groupsRes.Groups ?? []).map((g) => g.GroupName!).filter(Boolean);
      return mapCognitoUser(user, groups);
    })
  );

  return enriched.filter((u) => u.roles.length > 0);
}

export async function disableUser(username: string) {
  const { userPoolId } = requireCognitoConfig();
  const client = getCognitoClient();
  await client.send(
    new AdminDisableUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    })
  );
}

export function cognitoErrorMessage(err: unknown): string {
  if (err instanceof CognitoAuthError) return err.message;
  if (err && typeof err === 'object' && 'name' in err) {
    const name = String((err as { name: string }).name);
    const message =
      'message' in err ? String((err as { message: string }).message) : name;
    if (name === 'NotAuthorizedException') return 'Usuario o contraseña incorrectos';
    if (name === 'UserNotFoundException') return 'Usuario no encontrado';
    if (name === 'CodeMismatchException') return 'Código de verificación incorrecto';
    if (name === 'ExpiredCodeException') return 'El código ha expirado';
    if (name === 'InvalidPasswordException') return 'La contraseña no cumple los requisitos';
    if (name === 'UsernameExistsException') return 'El usuario ya existe';
    return message;
  }
  return 'Error de autenticación';
}
