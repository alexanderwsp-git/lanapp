import { created, found, ok, updated, failed } from '@sheep/server';
import { Response } from 'express';
import {
    SignUpCommand,
    ConfirmSignUpCommand,
    AdminGetUserCommand,
    AdminUpdateUserAttributesCommand,
    AdminDisableUserCommand,
    ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { cognitoClient } from './cognitoHelper';
import { cognitoService } from './cognito';

class CognitoUserService {
    private userPoolId = process.env.COGNITO_USER_POOL_ID!;
    private clientId = process.env.COGNITO_CLIENT_ID!;

    async registerUser(res: Response, username: string, password: string, email: string) {
        const command = new SignUpCommand({
            ClientId: this.clientId,
            Username: username,
            Password: password,
            UserAttributes: [{ Name: 'email', Value: email }],
        });

        try {
            const response = await cognitoClient.send(command);
            
            // Cognito will automatically send verification email with link
            ok(res, { 
                userSub: response.UserSub,
            }, 'User registered successfully. Please check your email for verification link.');
        } catch (error: any) {
            console.error('Cognito registration error:', error);
            if (error.name === 'UsernameExistsException') {
                return created(res, { error: 'Username already exists' });
            }
            if (error.name === 'InvalidPasswordException') {
                return created(res, { error: 'Password does not meet requirements' });
            }
            if (error.name === 'InvalidParameterException') {
                return created(res, { error: `Invalid parameters provided: ${error.message}` });
            }
            return failed(res, { error: `Registration failed: ${error.message}` });
        }
    }

    async confirmUser(res: Response, username: string, confirmationCode: string) {
        const command = new ConfirmSignUpCommand({
            ClientId: this.clientId,
            Username: username,
            ConfirmationCode: confirmationCode,
        });
        try {
            await cognitoClient.send(command);
            ok(res, {}, 'User confirmed successfully');
        } catch (error: any) {
            console.error('Cognito confirmation error:', error);
            if (error.name === 'CodeMismatchException') {
                return failed(res, 'Invalid confirmation code');
            }
            if (error.name === 'ExpiredCodeException') {
                return failed(res, 'Confirmation code has expired');
            }
            if (error.name === 'NotAuthorizedException') {
                return failed(res, 'User is already confirmed');
            }
            return failed(res, `Confirmation failed: ${error.message}`);
        }
    }

    async listUsers(res: Response, limit: number = 10) {
        const command = new ListUsersCommand({
            UserPoolId: this.userPoolId,
            Limit: limit,
        });

        const response = await cognitoClient.send(command);
        found(res, response.Users || []);
    }

    async findUserById(res: Response, userId: string) {
        const command = new AdminGetUserCommand({
            UserPoolId: this.userPoolId,
            Username: userId,
        });

        const response = await cognitoClient.send(command);
        found(res, response);
    }

    async updateUserAttributes(
        res: Response,
        username: string,
        attributes: { Name: string; Value: string }[]
    ) {
        const command = new AdminUpdateUserAttributesCommand({
            UserPoolId: this.userPoolId,
            Username: username,
            UserAttributes: attributes,
        });

        await cognitoClient.send(command);
        updated(res, { username, attributes });
    }

    async disableUser(res: Response, username: string) {
        const command = new AdminDisableUserCommand({
            UserPoolId: this.userPoolId,
            Username: username,
        });

        await cognitoClient.send(command);
        ok(res, {}, 'User has been disabled successfully!');
    }
}

export const cognitoUserService = new CognitoUserService();
