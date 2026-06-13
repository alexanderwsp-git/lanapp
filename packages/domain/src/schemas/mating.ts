import { z } from 'zod';
import { MatingStatus } from '../enums/mating';

export const MatingSchema = z.object({
    id: z.string().uuid(),
    maleId: z.string().uuid(),
    femaleId: z.string().uuid(),
    matingDate: z.date(),
    expectedBirthDate: z.date(),
    status: z.nativeEnum(MatingStatus),
    matingCount: z.number().int().min(1),
    effectivenessCounter: z.number().int().min(0),
    notes: z.string().optional(),
});

export type Mating = z.infer<typeof MatingSchema>;
export const MatingPartialSchema = MatingSchema.partial();

export const MatingCreateSchema = z.object({
    maleId: z.string().uuid(),
    femaleId: z.string().uuid(),
    matingDate: z.coerce.date(),
    expectedBirthDate: z.coerce.date().optional(),
    notes: z.string().optional(),
});

export type MatingCreate = z.infer<typeof MatingCreateSchema>;
