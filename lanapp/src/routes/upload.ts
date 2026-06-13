import { PresignedUploadSchema } from '@sheep/domain';
import { created, asyncHandler, validateSchema } from '@sheep/server';
import { Router, Request, Response } from 'express';

import { verifyToken } from '../middlewares/auth.middleware';
import { s3Service } from '../infra/s3.service';

const router = Router();

router.post(
    '/presigned',
    verifyToken,
    validateSchema(PresignedUploadSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { filename, contentType, folder } = req.body;
        const result = await s3Service.getPresignedUploadUrl(filename, contentType, folder);
        created(res, result);
    })
);

export default router;
