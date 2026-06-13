import { z } from 'zod';

export const IdSchema = z.object({
    id: z.string().uuid('Invalid ID format'),
});

export const SheepIdParamSchema = z.object({
    sheepId: z.string().uuid('Invalid sheep ID format'),
});

export const MatingIdParamSchema = z.object({
    matingId: z.string().uuid('Invalid mating ID format'),
});

export const QuerySchema = z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
});
