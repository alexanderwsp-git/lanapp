import { z } from 'zod';
import { MedicineStatus, MedicineType } from '../enums/medicine';

export const MedicineSchema = z.object({
    id: z.string().uuid(),
    type: z.nativeEnum(MedicineType),
    name: z.string(),
    dosage: z.string(),
    description: z.string().optional(),
    notes: z.string().optional(),
});

export type Medicine = z.infer<typeof MedicineSchema>;
export const MedicinePartialSchema = MedicineSchema.partial();

export const MedicineCreateSchema = z.object({
    type: z.nativeEnum(MedicineType),
    name: z.string().min(1),
    dosage: z.string().min(1),
    description: z.string().optional(),
    notes: z.string().optional(),
});

export type MedicineCreate = z.infer<typeof MedicineCreateSchema>;

export const MedicineUpdateSchema = MedicineCreateSchema.partial();
export type MedicineUpdate = z.infer<typeof MedicineUpdateSchema>;

export const MedicineApplicationSchema = z.object({
    id: z.string().uuid(),
    medicineId: z.string().uuid(),
    sheepId: z.string().uuid(),
    analysisId: z.string().uuid().optional(),
    applicationDate: z.coerce.date(),
    nextApplicationDate: z.coerce.date().optional(),
    status: z.nativeEnum(MedicineStatus),
    notes: z.string().optional(),
});

export type MedicineApplication = z.infer<typeof MedicineApplicationSchema>;
export const MedicineApplicationPartialSchema = MedicineApplicationSchema.partial();

export const MedicineApplicationCreateSchema = z.object({
    medicineId: z.string().uuid(),
    sheepId: z.string().uuid(),
    analysisId: z.string().uuid().optional(),
    applicationDate: z.coerce.date(),
    nextApplicationDate: z.coerce.date().optional(),
    status: z.nativeEnum(MedicineStatus).default(MedicineStatus.SCHEDULED),
    notes: z.string().optional(),
});

export type MedicineApplicationCreate = z.infer<typeof MedicineApplicationCreateSchema>;

export const MedicineApplicationUpdateSchema = MedicineApplicationCreateSchema.partial();
export type MedicineApplicationUpdate = z.infer<typeof MedicineApplicationUpdateSchema>;
