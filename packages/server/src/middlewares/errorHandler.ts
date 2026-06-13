import { Request, Response, NextFunction } from 'express';
import { failed, serverError } from '../utils/responseHandler';
import { logger } from './logger';

const authenticationErrors = (error: Error): string | null => {
    const errorMessages: Record<string, string> = {
        NotAuthorizedException: 'Invalid username or password',
        UserNotFoundException: 'User not found',
        UserNotConfirmedException: 'User not confirmed',
    };

    return errorMessages[error.name] || null;
};

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`${error.message}`);

    const authError = authenticationErrors(error);
    if (authError) {
        return failed(res, authError);
    }

    serverError(res, error.message);
};
