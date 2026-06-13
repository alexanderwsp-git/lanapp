import { z } from 'zod';

/** Route param schemas — local copy until @sheep/domain dist is rebuilt. */
export const SheepIdParamSchema = z.object({
    sheepId: z.string().uuid('Invalid sheep ID format'),
});
