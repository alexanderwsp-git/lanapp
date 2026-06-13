import { z } from 'zod';

export const WeightSchema = z.object({
    id: z.string().uuid().optional(),
    sheepId: z.string().uuid(),
    weight: z.number().positive(),
    measurementDate: z.coerce.date(),
    dailyGain: z.number().optional(),
    notes: z.string().optional(),
});

export type Weight = z.infer<typeof WeightSchema>;
export const WeightPartialSchema = WeightSchema.partial();

export const WeightCreateSchema = z.object({
    sheepId: z.string().uuid(),
    weight: z.number().positive(),
    measurementDate: z.coerce.date(),
    notes: z.string().optional(),
});

export type WeightCreate = z.infer<typeof WeightCreateSchema>;

export const WeightUpdateSchema = WeightCreateSchema.partial();
export type WeightUpdate = z.infer<typeof WeightUpdateSchema>;

export const WeightJsonSchema = WeightSchema.extend({
    measurementDate: z.string(),
});

export type WeightJson = z.infer<typeof WeightJsonSchema>;
