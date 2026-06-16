import { z } from 'zod';

export const WeaningRecordSchema = z.object({
    id: z.string().uuid().optional(),
    sheepId: z.string().uuid(),
    weaningDate: z.coerce.date(),
    weaningWeight: z.number().positive(),
    dailyGain: z.number().optional(),
    lotId: z.string().optional(),
    notes: z.string().optional(),
});

export type WeaningRecordInput = z.infer<typeof WeaningRecordSchema>;
export const WeaningRecordPartialSchema = WeaningRecordSchema.partial();

export const WeaningRecordCreateSchema = z.object({
    sheepId: z.string().uuid(),
    weaningDate: z.coerce.date(),
    weaningWeight: z.number().positive(),
    lotId: z.string().optional(),
    notes: z.string().optional(),
});

export type WeaningRecordCreate = z.infer<typeof WeaningRecordCreateSchema>;

/** GET /weaning-record/recent — optional range; service defaults to last `days` (10). */
export const WeaningRecordListQuerySchema = z
    .object({
        fromDate: z.coerce.date().optional(),
        toDate: z.coerce.date().optional(),
        days: z.coerce.number().int().positive().max(365).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.fromDate && data.toDate && data.fromDate > data.toDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'fromDate must be on or before toDate',
                path: ['fromDate'],
            });
        }
    });

export type WeaningRecordListQuery = z.infer<typeof WeaningRecordListQuerySchema>;
