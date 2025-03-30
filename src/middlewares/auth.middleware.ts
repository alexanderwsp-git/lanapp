import { Request, Response, NextFunction } from 'express';
import { GetUserCommand, AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import { failed } from '@awsp__/utils';
import { cognitoClient } from '@/config/cognito';

declare global {
    namespace Express {
        interface Request {
            user?: {
                username: string;
                email: string;
            };
        }
    }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return failed(res, 'No authorization header');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return failed(res, 'No token provided');
        }

        const command = new GetUserCommand({ AccessToken: token });
        const response = await cognitoClient.send(command);

        if (!response.UserAttributes) {
            return failed(res, 'Invalid token');
        }

        const username = response.UserAttributes.find((attr: AttributeType) => attr.Name === 'username')?.Value;
        const email = response.UserAttributes.find((attr: AttributeType) => attr.Name === 'email')?.Value;

        if (!username || !email) {
            return failed(res, 'Invalid user data');
        }

        req.user = { username, email };
        next();
    } catch (error) {
        return failed(res, 'Invalid token');
    }
}; 