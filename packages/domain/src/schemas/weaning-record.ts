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
