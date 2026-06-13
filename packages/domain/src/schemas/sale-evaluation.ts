import { z } from 'zod';

export const SaleEvaluationSchema = z.object({
    id: z.string().uuid().optional(),
    sheepId: z.string().uuid(),
    batchPeriod: z.string(),
    birthWeightAvg: z.number().positive().optional(),
    weaningWeight: z.number().positive().optional(),
    eligible: z.boolean(),
    reason: z.string().optional(),
    evaluatedAt: z.coerce.date(),
});

export type SaleEvaluationInput = z.infer<typeof SaleEvaluationSchema>;
export const SaleEvaluationPartialSchema = SaleEvaluationSchema.partial();
