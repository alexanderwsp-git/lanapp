import { createHmac } from 'node:crypto';

import {
  CognitoIdentityProviderClient,
  type AuthenticationResultType,
} from '@aws-sdk/client-cognito-identity-provider';

export function getCognitoClient(): CognitoIdentityProviderClient {
  return new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-east-1',
  });
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
