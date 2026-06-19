import { z } from 'zod';
import { AnalysisKind, AnalysisStatus } from '../enums/analysis';
import { MedicineType } from '../enums/medicine';
import { SheepTargetFiltersSchema } from './bulk';

export const AnalysisTypeCreateSchema = z.object({
    type: z.nativeEnum(AnalysisKind),
    name: z.string().min(1),
    description: z.string().optional(),
    defaultUnit: z.string().optional(),
    recommendedMedicineType: z.nativeEnum(MedicineType).optional(),
});

export type AnalysisTypeCreate = z.infer<typeof AnalysisTypeCreateSchema>;

export const AnalysisTypeUpdateSchema = AnalysisTypeCreateSchema.partial();
export type AnalysisTypeUpdate = z.infer<typeof AnalysisTypeUpdateSchema>;

export const AnalysisCreateSchema = z.object({
    analysisTypeId: z.string().uuid(),
    sheepId: z.string().uuid(),
    scheduledDate: z.coerce.date(),
    status: z.nativeEnum(AnalysisStatus).optional(),
    resultValue: z.string().optional().nullable(),
    famachaScore: z.number().int().min(1).max(5).optional().nullable(),
    diagnosis: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export type AnalysisCreate = z.infer<typeof AnalysisCreateSchema>;

export const AnalysisUpdateSchema = z.object({
    scheduledDate: z.coerce.date().optional(),
    completedDate: z.coerce.date().optional().nullable(),
    status: z.nativeEnum(AnalysisStatus).optional(),
    resultValue: z.string().optional().nullable(),
    famachaScore: z.number().int().min(1).max(5).optional().nullable(),
    diagnosis: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export type AnalysisUpdate = z.infer<typeof AnalysisUpdateSchema>;

export const BulkAnalysisScheduleSchema = z
    .object({
        analysisTypeId: z.string().uuid(),
        scheduledDate: z.coerce.date(),
        notes: z.string().optional(),
        sheepIds: z.array(z.string().uuid()).min(1).max(500).optional(),
        filters: SheepTargetFiltersSchema.optional(),
    })
    .refine(data => (data.sheepIds?.length ?? 0) > 0 || data.filters !== undefined, {
        message: 'Provide sheepIds or filters',
    });

export type BulkAnalysisSchedule = z.infer<typeof BulkAnalysisScheduleSchema>;
