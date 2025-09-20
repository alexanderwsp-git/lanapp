import { Request, Response, NextFunction } from 'express';
import { GetUserCommand, AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import { failed } from '@alexanderwsp-git/awsp-utils';
import { cognitoClient } from '../config/cognito';
import { jwtDecode } from 'jwt-decode';

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

        // Get username from JWT token
        const decodedToken = jwtDecode(token) as { username: string };
        if (!decodedToken.username) {
            return failed(res, 'Invalid token: missing username');
        }
        console.log(`decodedToken`, decodedToken);

        // Get additional user attributes from Cognito
        const command = new GetUserCommand({ AccessToken: token });
        const response = await cognitoClient.send(command);
        console.log(`response`, response.UserAttributes);
        if (!response.UserAttributes) {
            return failed(res, 'Invalid token');
        }

        const email = response.UserAttributes.find(
            (attr: AttributeType) => attr.Name === 'email'
        )?.Value;

        if (!email) return failed(res, 'Invalid token: missing email');

        req.user = { username: decodedToken.username, email };
        next();
    } catch (error) {
        console.log(`error`, error);
        return failed(res, 'Invalid token');
    }
};
