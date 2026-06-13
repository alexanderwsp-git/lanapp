import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateSchema =
    (schema: z.ZodSchema) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const parsed = await schema.safeParseAsync(req.body);
        if (!parsed.success) {
            res.status(207).json({
                error: parsed.error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                })),
                message: 'Invalid request data',
                success: false,
            });
            return;
        }

        req.body = parsed.data;
        next();
    };
