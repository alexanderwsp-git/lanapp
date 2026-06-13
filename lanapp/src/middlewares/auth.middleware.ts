import { failed } from '@sheep/server';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';

declare global {
    namespace Express {
        interface Request {
            user?: {
                username: string;
                email: string;
                roles: string[];
            };
        }
    }
}

const skipAuth = process.env.SKIP_AUTH === 'true';

function createJwtCheck(): RequestHandler | null {
    if (!process.env.AUTH0_AUDIENCE) {
        return null;
    }

    return auth({
        audience: process.env.AUTH0_AUDIENCE,
        issuerBaseURL:
            process.env.AUTH0_ISSUER_BASE_URL || `https://${process.env.AUTH0_DOMAIN}`,
    });
}

const jwtCheck = createJwtCheck();

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    if (skipAuth) {
        req.user = {
            username: 'dev-user',
            email: 'dev@localhost',
            roles: ['admin'],
        };
        return next();
    }

    if (!jwtCheck) {
        return failed(res, 'Auth0 is not configured (set AUTH0_AUDIENCE or SKIP_AUTH=true)');
    }

    jwtCheck(req, res, (err?: unknown) => {
        if (err) {
            return failed(res, 'Invalid token');
        }

        const payload = (req as Request & { auth?: { payload?: Record<string, unknown> } }).auth
            ?.payload;
        if (!payload) {
            return failed(res, 'Invalid token');
        }

        const email = (payload.email as string) || (payload['https://lanapp/email'] as string) || '';
        const username =
            (payload.nickname as string) ||
            (payload.preferred_username as string) ||
            (payload.sub as string);

        const roles =
            (payload['https://lanapp/roles'] as string[]) ||
            (payload['https://lanapp.io/roles'] as string[]) ||
            [];

        req.user = { username, email, roles };
        next();
    });
};
