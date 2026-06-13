import { z } from 'zod';

export const PresignedUploadSchema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    folder: z.enum(['sheep', 'health', 'pregnancy']).default('sheep'),
});

export type PresignedUploadInput = z.infer<typeof PresignedUploadSchema>;
