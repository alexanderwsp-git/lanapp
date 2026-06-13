import { WeaningRecordCreateSchema, BulkWeaningSchema, IdSchema } from '@sheep/domain';
import { created, failed, found, asyncHandler, validateSchema, validateParams } from '@sheep/server';
import { Router, Request, Response } from 'express';
import { WeaningRecordService } from '../services/weaning-record.service';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const weaningRecordService = new WeaningRecordService();

router.get(
    '/alerts',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const minDays = parseInt(req.query.minDays as string) || 75;
        const alerts = await weaningRecordService.getWeaningAlerts(minDays);
        found(res, alerts);
    })
);

router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const records = await weaningRecordService.findBySheep(req.params.sheepId);
        found(res, records);
    })
);

router.post(
    '/bulk',
    verifyToken,
    validateSchema(BulkWeaningSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await weaningRecordService.bulkRecordWeaning(req.body, req.user!.username);
        created(res, result);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(WeaningRecordCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const record = await weaningRecordService.recordWeaning(req.body, req.user!.username);
        created(res, record);
    })
);

export default router;
