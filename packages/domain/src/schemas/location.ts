import { z } from 'zod';

export const LocationSchema = z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1, 'Name is required').max(50, 'Name is too long'),
    address: z.string().trim().min(1, 'Address is required').max(100, 'Address is too long'),
    imageUrl: z.string().url('Invalid URL format').optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    description: z.string().trim().max(500, 'Description is too long').optional(),
});

export type Location = z.infer<typeof LocationSchema>;
export const LocationPartialSchema = LocationSchema.partial();

export const LocationCreateSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(50, 'Name is too long'),
    address: z.string().trim().min(1, 'Address is required').max(100, 'Address is too long'),
    imageUrl: z.string().url('Invalid URL format').optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    description: z.string().trim().max(500, 'Description is too long').optional(),
});

export type LocationCreate = z.infer<typeof LocationCreateSchema>;

export const LocationUpdateSchema = LocationCreateSchema.partial();
export type LocationUpdate = z.infer<typeof LocationUpdateSchema>;
