import { ok } from '@sheep/server';
import { Response } from 'express';
import {
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { cognitoClient } from './cognitoHelper';

class CognitoPasswordService {
    private clientId = process.env.COGNITO_CLIENT_ID!;

    async forgotPassword(res: Response, username: string) {
        const command = new ForgotPasswordCommand({
            ClientId: this.clientId,
            Username: username,
        });

        await cognitoClient.send(command);
        ok(res, {}, 'Password reset code sent successfully!');
    }

    async resetPassword(
        res: Response,
        username: string,
        confirmationCode: string,
        newPassword: string
    ) {
        const command = new ConfirmForgotPasswordCommand({
            ClientId: this.clientId,
            Username: username,
            ConfirmationCode: confirmationCode,
            Password: newPassword,
        });

        await cognitoClient.send(command);
        ok(res, {}, 'Password has been reset successfully!');
    }
}

export const cognitoPasswordService = new CognitoPasswordService();
