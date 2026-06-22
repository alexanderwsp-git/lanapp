import { found, asyncHandler } from '@sheep/server';
import { Router, Request, Response } from 'express';

import { verifyToken } from '../middlewares/auth.middleware';
import { PregnancyCheckService } from '../services/pregnancy-check.service';

const router = Router();
const pregnancyCheckService = new PregnancyCheckService();

router.get(
    '/pending-delivery',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        const pending = await pregnancyCheckService.findPendingDeliveries();
        found(res, pending);
    })
);

export default router;
