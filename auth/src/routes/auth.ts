import { asyncHandler, validateSchema } from '@sheep/server';
import { AccessTokenSchema, AuthSchema, RefreshTokenSchema, RegisterSchema } from '../validation/authSchema';
import { Router } from 'express';
import { auth0Service } from '../auth/auth0Service';

const router = Router();

router.post(
    '/login',
    validateSchema(AuthSchema),
    asyncHandler(async (req, res) => {
        const { username, password } = req.body;
        await auth0Service.login(res, username, password);
    })
);

router.post(
    '/logout',
    asyncHandler(async (_req, res) => {
        await auth0Service.logout(res);
    })
);

router.post(
    '/refresh',
    validateSchema(RefreshTokenSchema),
    asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        await auth0Service.refreshToken(res, refreshToken);
    })
);

router.get(
    '/userinfo',
    validateSchema(AccessTokenSchema),
    asyncHandler(async (req, res) => {
        const { accessToken } = req.query;
        await auth0Service.getUserInfo(res, accessToken as string);
    })
);

router.post(
    '/register',
    validateSchema(RegisterSchema),
    asyncHandler(async (req, res) => {
        const { username, email, password } = req.body;
        await auth0Service.register(res, email, password, username);
    })
);

export default router;
