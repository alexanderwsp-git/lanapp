import { z } from 'zod';
import { SheepCategory } from '../enums/sheep-category';
import { BirthType, Gender, RecordType, SheepBreed, SheepStatus } from '../enums/sheep';

export const SheepSchema = z.object({
    id: z.string().uuid(),
    tag: z.string(),
    name: z.string().optional(),
    breed: z.nativeEnum(SheepBreed),
    gender: z.nativeEnum(Gender),
    birthDate: z.coerce.date(),
    birthType: z.nativeEnum(BirthType),
    weight: z.number().positive(),
    status: z.nativeEnum(SheepStatus),
    category: z.nativeEnum(SheepCategory),
    recordType: z.nativeEnum(RecordType),
    quarantineEndDate: z.coerce.date().optional(),
    motherId: z.string().uuid().optional(),
    fatherId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional(),
    isPregnant: z.boolean().optional(),
    notes: z.string().optional(),
});

export type Sheep = z.infer<typeof SheepSchema>;
export const SheepPartialSchema = SheepSchema.partial();

export const SheepCreateSchema = z.object({
    tag: z.string().min(1),
    name: z.string().optional(),
    breed: z.nativeEnum(SheepBreed),
    gender: z.nativeEnum(Gender),
    birthDate: z.coerce.date(),
    birthType: z.nativeEnum(BirthType).default(BirthType.SINGLE),
    weight: z.number().positive(),
    recordType: z.nativeEnum(RecordType),
    motherId: z.string().uuid().optional(),
    fatherId: z.string().uuid().optional(),
    currentLocationId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional(),
    notes: z.string().optional(),
});

export type SheepCreate = z.infer<typeof SheepCreateSchema>;

export const SheepUpdateSchema = SheepCreateSchema.partial().extend({
    notes: z.string().optional(),
});

export type SheepUpdate = z.infer<typeof SheepUpdateSchema>;

/** JSON/API variant — dates arrive as ISO strings from HTTP. */
export const SheepJsonSchema = SheepSchema.extend({
    birthDate: z.string(),
    quarantineEndDate: z.string().optional(),
});

export type SheepJson = z.infer<typeof SheepJsonSchema>;
