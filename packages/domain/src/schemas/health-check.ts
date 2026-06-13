import { z } from 'zod';

export const HealthCheckSchema = z.object({
    id: z.string().uuid().optional(),
    sheepId: z.string().uuid(),
    checkDate: z.coerce.date(),
    famachaScore: z.number().int().min(1).max(5),
    aiSuggestedScore: z.number().int().min(1).max(5).optional(),
    imageUrl: z.string().url().optional(),
    weight: z.number().positive().optional(),
    notes: z.string().optional(),
    confirmedBy: z.string().optional(),
});

export type HealthCheckInput = z.infer<typeof HealthCheckSchema>;
export const HealthCheckPartialSchema = HealthCheckSchema.partial();

export const HealthCheckCreateSchema = z.object({
    sheepId: z.string().uuid(),
    checkDate: z.coerce.date(),
    famachaScore: z.number().int().min(1).max(5),
    weight: z.number().positive().optional(),
    notes: z.string().optional(),
});

export type HealthCheckCreate = z.infer<typeof HealthCheckCreateSchema>;

export const HealthCheckUpdateSchema = HealthCheckCreateSchema.partial();
export type HealthCheckUpdate = z.infer<typeof HealthCheckUpdateSchema>;

export const HealthCheckJsonSchema = HealthCheckSchema.extend({
    checkDate: z.string(),
});

export type HealthCheckJson = z.infer<typeof HealthCheckJsonSchema>;
