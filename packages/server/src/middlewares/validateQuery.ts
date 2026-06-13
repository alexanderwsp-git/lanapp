import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { failed } from '../utils/responseHandler';

export const validateQuery =
    (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
        const parsed = schema.safeParse(req.query);
        if (!parsed.success) {
            const errorMessages = parsed.error.errors
                .map(err => `${err.path.join('.')}: ${err.message}`)
                .join(', ');
            return failed(res, errorMessages);
        }
        req.query = parsed.data;
        next();
    };
