import { z } from 'zod';
import { BreedingResult, DiagnosisType } from '../enums/breeding';
import { PregnancyCheckKind } from '../enums/breeding';

export const BreedingDiagnosisSchema = z.object({
    diagnosisType: z.nativeEnum(DiagnosisType),
    diagnosisDate: z.coerce.date(),
    result: z.nativeEnum(BreedingResult),
    vitaselApplied: z.boolean().optional(),
    notes: z.string().optional(),
    nextCheckDate: z.coerce.date().optional(),
});

export type BreedingDiagnosis = z.infer<typeof BreedingDiagnosisSchema>;

export const PregnancyCheckSchema = z.object({
    matingId: z.string().uuid(),
    checkDate: z.coerce.date(),
    isPregnant: z.boolean(),
    checkType: z.nativeEnum(DiagnosisType).optional(),
    kind: z.nativeEnum(PregnancyCheckKind).default(PregnancyCheckKind.DIAGNOSIS),
    notes: z.string().optional(),
    nextCheckDate: z.coerce.date().optional(),
    vitaselApplied: z.boolean().optional(),
});

export type PregnancyCheck = z.infer<typeof PregnancyCheckSchema>;

export const PregnancyCheckCreateSchema = PregnancyCheckSchema;
export type PregnancyCheckCreate = z.infer<typeof PregnancyCheckCreateSchema>;

export const DeliveryRecordSchema = z.object({
    deliveryDate: z.coerce.date(),
    notes: z.string().optional(),
});

export type DeliveryRecord = z.infer<typeof DeliveryRecordSchema>;
