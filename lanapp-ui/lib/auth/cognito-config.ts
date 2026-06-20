import { createHmac } from 'node:crypto';

import {
  CognitoIdentityProviderClient,
  type AuthenticationResultType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  createCredentialChain,
  fromContainerMetadata,
  fromEnv,
  fromIni,
} from '@aws-sdk/credential-providers';

function cognitoRegion() {
  return process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-east-1';
}

/** Public Cognito APIs (login, forgot, reset) — no IAM; only COGNITO_CLIENT_SECRET for SECRET_HASH. */
export function getPublicCognitoClient(): CognitoIdentityProviderClient {
  return new CognitoIdentityProviderClient({
    region: cognitoRegion(),
    credentials: {
      accessKeyId: 'unused',
      secretAccessKey: 'unused',
    },
  });
}

const adminCredentialsProvider = createCredentialChain(
  fromEnv(),
  fromIni({ profile: process.env.AWS_PROFILE || 'default' }),
  fromContainerMetadata()
);

/** Admin Cognito APIs (invite, list users) — ECS task role, ~/.aws/credentials, or env (local dev only). */
export function getAdminCognitoClient(): CognitoIdentityProviderClient {
  return new CognitoIdentityProviderClient({
    region: cognitoRegion(),
    credentials: adminCredentialsProvider,
  });
}

/** @deprecated Use getPublicCognitoClient or getAdminCognitoClient */
export function getCognitoClient(): CognitoIdentityProviderClient {
  return getPublicCognitoClient();
}

export function requireCognitoConfig() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  if (!userPoolId || !clientId || !clientSecret) {
    throw new Error(
      'Missing COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, or COGNITO_CLIENT_SECRET'
    );
  }

  return { userPoolId, clientId, clientSecret };
}

export function mapAuthResult(result: AuthenticationResultType) {
  return {
    AccessToken: result.AccessToken ?? '',
    RefreshToken: result.RefreshToken ?? '',
    IdToken: result.IdToken ?? '',
    ExpiresIn: result.ExpiresIn ?? 3600,
    TokenType: result.TokenType ?? 'Bearer',
  };
}

export function secretHash(username: string, clientId: string, clientSecret: string): string {
  return createHmac('sha256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}
