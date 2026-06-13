import { created, failed } from '@sheep/server';
import { Response } from 'express';

interface Auth0TokenResponse {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    token_type: string;
    expires_in: number;
}

interface Auth0UserInfo {
    sub: string;
    email?: string;
    name?: string;
    nickname?: string;
    picture?: string;
}

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

async function requestToken(body: Record<string, string>): Promise<Auth0TokenResponse> {
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Auth0 token request failed');
    }
    return data;
}

export const auth0Service = {
    async login(res: Response, username: string, password: string): Promise<void> {
        try {
            const body: Record<string, string> = {
                grant_type: 'password',
                username,
                password,
                client_id: AUTH0_CLIENT_ID,
                scope: 'openid profile email offline_access',
            };

            if (AUTH0_AUDIENCE) {
                body.audience = AUTH0_AUDIENCE;
            }
            if (AUTH0_CLIENT_SECRET) {
                body.client_secret = AUTH0_CLIENT_SECRET;
            }

            const tokens = await requestToken(body);

            created(res, {
                AccessToken: tokens.access_token,
                RefreshToken: tokens.refresh_token || '',
                IdToken: tokens.id_token || '',
                ExpiresIn: tokens.expires_in,
                TokenType: tokens.token_type,
            });
        } catch (error) {
            failed(res, error instanceof Error ? error.message : 'Login failed');
        }
    },

    async refreshToken(res: Response, refreshToken: string): Promise<void> {
        try {
            const body: Record<string, string> = {
                grant_type: 'refresh_token',
                client_id: AUTH0_CLIENT_ID,
                refresh_token: refreshToken,
            };

            if (AUTH0_CLIENT_SECRET) {
                body.client_secret = AUTH0_CLIENT_SECRET;
            }

            const tokens = await requestToken(body);

            created(res, {
                AccessToken: tokens.access_token,
                RefreshToken: tokens.refresh_token || refreshToken,
                IdToken: tokens.id_token || '',
                ExpiresIn: tokens.expires_in,
                TokenType: tokens.token_type,
            });
        } catch (error) {
            failed(res, error instanceof Error ? error.message : 'Token refresh failed');
        }
    },

    async logout(res: Response): Promise<void> {
        created(res, { message: 'Logged out successfully' });
    },

    async getUserInfo(res: Response, accessToken: string): Promise<void> {
        try {
            const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                return failed(res, 'Failed to fetch user info');
            }

            const userInfo: Auth0UserInfo = await response.json();
            created(res, userInfo);
        } catch (error) {
            failed(res, error instanceof Error ? error.message : 'Failed to fetch user info');
        }
    },

    async register(
        res: Response,
        email: string,
        password: string,
        username: string
    ): Promise<void> {
        try {
            const body: Record<string, string> = {
                client_id: AUTH0_CLIENT_ID,
                email,
                password,
                connection: process.env.AUTH0_CONNECTION || 'Username-Password-Authentication',
                username,
            };

            const response = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) {
                return failed(res, data.description || data.message || 'Registration failed');
            }

            created(res, { message: 'Registration successful', userId: data._id });
        } catch (error) {
            failed(res, error instanceof Error ? error.message : 'Registration failed');
        }
    },
};
