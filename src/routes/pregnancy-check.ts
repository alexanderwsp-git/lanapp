import { Router, Request, Response } from 'express';
import { PregnancyCheckService } from '../services/pregnancy-check.service';
import { IdSchema, created, failed, found, PregnancyCheckSchema } from '@alexanderwsp-git/awsp-utils';
import { asyncHandler, validateSchema, validateParams } from '@alexanderwsp-git/awsp-utils';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const pregnancyCheckService = new PregnancyCheckService();

// Record a pregnancy check
router.post(
    '/',
    verifyToken,
    validateSchema(PregnancyCheckSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const check = await pregnancyCheckService.recordCheck(req.body, req.user!.username);
        created(res, check);
    })
);

// Get check history for a mating
router.get(
    '/mating/:matingId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const checks = await pregnancyCheckService.getCheckHistory(req.params.matingId);
        found(res, checks);
    })
);

// Get latest check for a mating
router.get(
    '/mating/:matingId/latest',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const check = await pregnancyCheckService.getLatestCheck(req.params.matingId);
        if (!check) return failed(res, 'No pregnancy checks found');
        found(res, check);
    })
);

export default router;
