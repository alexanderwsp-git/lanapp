import { created, failed, ok } from '@sheep/server';
import {
    AdminInitiateAuthCommand,
    GlobalSignOutCommand,
    GetUserCommand,
    ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Response } from 'express';
import { cognitoClient } from './cognitoHelper';

class CognitoService {
    private userPoolId: string;
    private clientId: string;

    constructor() {
        this.userPoolId = process.env.COGNITO_USER_POOL_ID!;
        this.clientId = process.env.COGNITO_CLIENT_ID!;
    }

    async authenticateUser(res: Response, username: string, password: string) {
        const command = new AdminInitiateAuthCommand({
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            ClientId: this.clientId,
            UserPoolId: this.userPoolId,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        });

        const response = await cognitoClient.send(command);
        if (!response.AuthenticationResult) return failed(res, 'Authentication failed');

        ok(res, response.AuthenticationResult, 'User Authenticated');
    }

    async logoutUser(res: Response, accessToken: string) {
        const command = new GlobalSignOutCommand({ AccessToken: accessToken });

        await cognitoClient.send(command);

        ok(res, {}, 'User logged out successfully');
    }

    async refreshToken(res: Response, refreshToken: string) {
        const command = new AdminInitiateAuthCommand({
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: this.clientId,
            UserPoolId: this.userPoolId,
            AuthParameters: { REFRESH_TOKEN: refreshToken },
        });

        const response = await cognitoClient.send(command);
        if (!response.AuthenticationResult) return failed(res, 'Invalid refresh token');

        created(res, response.AuthenticationResult);
    }

    async verifyEmail(res: Response, accessToken: string) {
        const command = new GetUserCommand({ AccessToken: accessToken });

        const response = await cognitoClient.send(command);
        const emailVerified =
            response.UserAttributes?.find(attr => attr.Name === 'email_verified')?.Value === 'true';

        const msn = emailVerified ? 'Email is verified' : 'Email is not verified';
        ok(res, {}, msn);
    }

    async resendConfirmationCode(res: Response, username: string) {
        try {
            await this.triggerConfirmationCode(username);
            ok(res, {}, 'Confirmation code sent successfully!');
        } catch (error: any) {
            // Handle specific AWS Cognito errors based on documentation
            if (error.name === 'UserNotFoundException') {
                return failed(res, 'User not found');
            }
            if (error.name === 'InvalidParameterException') {
                return failed(res, 'Invalid parameters provided');
            }
            if (error.name === 'CodeDeliveryFailureException') {
                return failed(res, 'Failed to deliver confirmation code');
            }
            if (error.name === 'LimitExceededException') {
                return failed(res, 'Too many requests. Please try again later');
            }
            if (error.name === 'TooManyRequestsException') {
                return failed(res, 'Too many requests. Please try again later');
            }
            
            // Generic error fallback
            failed(res, error.message || 'Failed to send confirmation code');
        }
    }

    // Core method to trigger confirmation code sending (used by both public API and internal calls)
    async triggerConfirmationCode(username: string): Promise<void> {
        const command = new ResendConfirmationCodeCommand({
            ClientId: this.clientId,
            Username: username,
        });

        try {
            const response = await cognitoClient.send(command);
            
            // Log delivery details for debugging
            if (response.CodeDeliveryDetails) {
                console.log('Confirmation code delivery details:', {
                    attributeName: response.CodeDeliveryDetails.AttributeName,
                    deliveryMedium: response.CodeDeliveryDetails.DeliveryMedium,
                    destination: response.CodeDeliveryDetails.Destination
                });
            }
        } catch (error: any) {
            // Re-throw with more context for better error handling
            throw new Error(`Failed to send confirmation code: ${error.message}`);
        }
    }

}

export const cognitoService = new CognitoService();
