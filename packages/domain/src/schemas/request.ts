import { z } from 'zod';

export const IdSchema = z.object({
    id: z.string().uuid('Invalid ID format'),
});

export const QuerySchema = z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
});
