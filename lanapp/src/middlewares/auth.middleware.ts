import { failed } from '@sheep/server';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Request, Response, NextFunction } from 'express';

const skipAuth = process.env.SKIP_AUTH === 'true';
const APP_GROUP_PREFIX = process.env.COGNITO_APP_GROUP_PREFIX || 'lanapp_';

export type AuthUser = {
    username: string;
    email: string;
    roles: string[];
    groups: string[];
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

function createVerifier() {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!userPoolId || !clientId) {
        return null;
    }

    return CognitoJwtVerifier.create({
        userPoolId,
        tokenUse: 'access',
        clientId,
    });
}

const verifier = createVerifier();

function mapGroupsToRoles(groups: string[]): string[] {
    const roles = groups
        .filter((g) => g.startsWith(APP_GROUP_PREFIX))
        .map((g) => g.slice(APP_GROUP_PREFIX.length));

    if (groups.includes('platform_admin') && !roles.includes('admin')) {
        roles.push('admin');
    }

    return roles;
}

function extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return null;
    }
    return header.slice(7).trim();
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    if (skipAuth) {
        req.user = {
            username: 'dev-user',
            email: 'dev@localhost',
            roles: ['admin'],
            groups: ['lanapp_admin'],
        };
        return next();
    }

    if (!verifier) {
        return failed(
            res,
            'Cognito is not configured (set COGNITO_USER_POOL_ID + COGNITO_CLIENT_ID or SKIP_AUTH=true)'
        );
    }

    const token = extractBearerToken(req);
    if (!token) {
        return failed(res, 'Missing or invalid Authorization header');
    }

    try {
        const payload = await verifier.verify(token);
        const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
        const email = (payload.email as string) || '';
        const username =
            (payload.username as string) ||
            (payload['cognito:username'] as string) ||
            (payload.sub as string);

        req.user = {
            username,
            email,
            groups,
            roles: mapGroupsToRoles(groups),
        };
        next();
    } catch {
        return failed(res, 'Invalid token');
    }
};

export const requireRoles =
    (...allowed: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        const userRoles = req.user?.roles ?? [];
        if (!allowed.some((role) => userRoles.includes(role))) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
                data: null,
                error: 'Forbidden',
            });
        }
        next();
    };
