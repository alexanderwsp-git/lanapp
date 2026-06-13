import { asyncHandler, validateSchema } from '@sheep/server';
import { ForgotPasswordSchema, ResetPasswordSchema } from '../validation/authSchema';
import { Router } from 'express';
import { cognitoPasswordService } from '../auth/cognitoPasswordService';

const router = Router();

router.post(
    '/forgot-password',
    validateSchema(ForgotPasswordSchema),
    asyncHandler(async (req, res) => {
        const { username } = req.body;
        await cognitoPasswordService.forgotPassword(res, username);
    })
);

router.post(
    '/reset-password',
    validateSchema(ResetPasswordSchema),
    asyncHandler(async (req, res) => {
        const { username, confirmationCode, newPassword } = req.body;
        await cognitoPasswordService.resetPassword(res, username, confirmationCode, newPassword);
    })
);

export default router;
