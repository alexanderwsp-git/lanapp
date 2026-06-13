import { z } from 'zod';

export const PregnancyCheckSchema = z.object({
    matingId: z.string().uuid(),
    checkDate: z.coerce.date(),
    isPregnant: z.boolean(),
    notes: z.string().optional(),
    nextCheckDate: z.coerce.date().optional(),
});

export type PregnancyCheck = z.infer<typeof PregnancyCheckSchema>;

export const PregnancyCheckCreateSchema = PregnancyCheckSchema;
export type PregnancyCheckCreate = z.infer<typeof PregnancyCheckCreateSchema>;

export const DeliveryRecordSchema = z.object({
    deliveryDate: z.coerce.date(),
    notes: z.string().optional(),
});

export type DeliveryRecord = z.infer<typeof DeliveryRecordSchema>;
