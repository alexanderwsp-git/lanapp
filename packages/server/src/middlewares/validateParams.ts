import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { failed } from '../utils/responseHandler';

export const validateParams =
    (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
        const parsed = schema.safeParse(req.params);
        if (!parsed.success) {
            const errorMessages = parsed.error.errors
                .map(err => `${err.path.join('.')}: ${err.message}`)
                .join(', ');

            return failed(res, 'Invalid request parameters', errorMessages);
        }
        next();
    };
