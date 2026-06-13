import { z } from 'zod';
import { Gender, SheepStatus } from '../enums/sheep';
import { SheepCategory } from '../enums/sheep-category';

export const SheepTargetFiltersSchema = z.object({
    gender: z.nativeEnum(Gender).optional(),
    status: z.nativeEnum(SheepStatus).optional(),
    category: z.nativeEnum(SheepCategory).optional(),
    locationId: z.string().uuid().optional(),
});

export type SheepTargetFilters = z.infer<typeof SheepTargetFiltersSchema>;

export const SheepTargetSchema = z
    .object({
        sheepIds: z.array(z.string().uuid()).min(1).max(500).optional(),
        filters: SheepTargetFiltersSchema.optional(),
    })
    .refine(data => (data.sheepIds?.length ?? 0) > 0 || data.filters !== undefined, {
        message: 'Provide sheepIds or filters',
    });

export type SheepTarget = z.infer<typeof SheepTargetSchema>;

export const BulkResultItemSchema = z.object({
    sheepId: z.string().uuid(),
    recordId: z.string().uuid(),
});

export const BulkFailureSchema = z.object({
    sheepId: z.string().uuid(),
    error: z.string(),
});

export const BulkResultSchema = z.object({
    succeeded: z.array(BulkResultItemSchema),
    failed: z.array(BulkFailureSchema),
    total: z.number().int().nonnegative(),
});

export type BulkResult = z.infer<typeof BulkResultSchema>;

export const BulkMedicineScheduleSchema = z
    .object({
        medicineId: z.string().uuid(),
        applicationDate: z.coerce.date(),
        notes: z.string().optional(),
        sheepIds: z.array(z.string().uuid()).min(1).max(500).optional(),
        filters: SheepTargetFiltersSchema.optional(),
    })
    .refine(data => (data.sheepIds?.length ?? 0) > 0 || data.filters !== undefined, {
        message: 'Provide sheepIds or filters',
    });

export type BulkMedicineSchedule = z.infer<typeof BulkMedicineScheduleSchema>;

export const BulkBreedingCycleScheduleSchema = z.object({
    cycleName: z.string().min(1),
    ramId: z.string().uuid().optional(),
    matingDate: z.coerce.date(),
    vitaselApplied: z.boolean().default(false),
    notes: z.string().optional(),
    eweIds: z.array(z.string().uuid()).min(1).max(500),
});

export type BulkBreedingCycleSchedule = z.infer<typeof BulkBreedingCycleScheduleSchema>;

export const BulkMatingScheduleSchema = z.object({
    maleId: z.string().uuid(),
    matingDate: z.coerce.date(),
    expectedBirthDate: z.coerce.date().optional(),
    notes: z.string().optional(),
    femaleIds: z.array(z.string().uuid()).min(1).max(500),
});

export type BulkMatingSchedule = z.infer<typeof BulkMatingScheduleSchema>;

export const BulkWeaningRecordItemSchema = z.object({
    sheepId: z.string().uuid(),
    weaningWeight: z.number().positive(),
    notes: z.string().optional(),
});

export type BulkWeaningRecordItem = z.infer<typeof BulkWeaningRecordItemSchema>;

export const BulkWeaningSchema = z
    .object({
        weaningDate: z.coerce.date(),
        lotId: z.string().optional(),
        notes: z.string().optional(),
        records: z.array(BulkWeaningRecordItemSchema).min(1).max(500).optional(),
        sheepIds: z.array(z.string().uuid()).min(1).max(500).optional(),
        filters: SheepTargetFiltersSchema.optional(),
        defaultWeight: z.number().positive().optional(),
    })
    .superRefine((data, ctx) => {
        const hasRecords = (data.records?.length ?? 0) > 0;
        const hasIds = (data.sheepIds?.length ?? 0) > 0;
        const hasFilters = data.filters !== undefined;

        if (!hasRecords && !hasIds && !hasFilters) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Provide records, sheepIds, or filters',
            });
        }

        if (!hasRecords && (hasIds || hasFilters) && data.defaultWeight === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'defaultWeight is required when using sheepIds or filters without records',
            });
        }
    });

export type BulkWeaning = z.infer<typeof BulkWeaningSchema>;
