import { z } from 'zod';
import { BreedingCycleStatus, BreedingResult, DiagnosisType } from '../enums/breeding';

export const BreedingCycleSchema = z.object({
    id: z.string().uuid().optional(),
    eweId: z.string().uuid(),
    cycleName: z.string(),
    ramId: z.string().uuid().optional(),
    matingDate: z.coerce.date(),
    diagnosisType: z.nativeEnum(DiagnosisType).optional(),
    diagnosisDate: z.coerce.date().optional(),
    result: z.nativeEnum(BreedingResult).optional(),
    status: z.nativeEnum(BreedingCycleStatus).default(BreedingCycleStatus.ACTIVE),
    vitaselApplied: z.boolean().default(false),
    expectedBirthDate: z.coerce.date().optional(),
    actualBirthDate: z.coerce.date().optional(),
    notes: z.string().optional(),
});

export type BreedingCycleInput = z.infer<typeof BreedingCycleSchema>;
export const BreedingCyclePartialSchema = BreedingCycleSchema.partial();

export const BreedingCycleCreateSchema = z.object({
    eweId: z.string().uuid(),
    cycleName: z.string().min(1),
    ramId: z.string().uuid().optional(),
    matingDate: z.coerce.date(),
    vitaselApplied: z.boolean().default(false),
    notes: z.string().optional(),
});

export type BreedingCycleCreate = z.infer<typeof BreedingCycleCreateSchema>;

export const BreedingCycleUpdateSchema = BreedingCycleCreateSchema.partial().extend({
    diagnosisType: z.nativeEnum(DiagnosisType).optional(),
    diagnosisDate: z.coerce.date().optional(),
    result: z.nativeEnum(BreedingResult).optional(),
    expectedBirthDate: z.coerce.date().optional(),
    actualBirthDate: z.coerce.date().optional(),
});

export type BreedingCycleUpdate = z.infer<typeof BreedingCycleUpdateSchema>;
