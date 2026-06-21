import { MatingIdParamSchema, PregnancyCheckCreateSchema, DeliveryRecordSchema } from '@sheep/domain';
import { created, failed, found, asyncHandler, validateSchema, validateParams } from '@sheep/server';
import { Router, Request, Response } from 'express';
import { PregnancyCheckService } from '../services/pregnancy-check.service';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const pregnancyCheckService = new PregnancyCheckService();

// Record a pregnancy check
router.post(
    '/',
    verifyToken,
    validateSchema(PregnancyCheckCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const check = await pregnancyCheckService.recordCheck(req.body, req.user!.username);
        created(res, check);
    })
);

// Get check history for a mating
router.get(
    '/mating/:matingId',
    verifyToken,
    validateParams(MatingIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const checks = await pregnancyCheckService.getCheckHistory(req.params.matingId);
        found(res, checks);
    })
);

// Get latest check for a mating
router.get(
    '/mating/:matingId/latest',
    verifyToken,
    validateParams(MatingIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const check = await pregnancyCheckService.getLatestCheck(req.params.matingId);
        if (!check) return failed(res, 'No pregnancy checks found');
        found(res, check);
    })
);

// Record delivery for a mating
router.post(
    '/mating/:matingId/delivery',
    verifyToken,
    validateParams(MatingIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const parsed = DeliveryRecordSchema.parse(req.body);
        const check = await pregnancyCheckService.recordDelivery(
            req.params.matingId,
            parsed,
            req.user!.username
        );
        created(res, check);
    })
);

export default router;
