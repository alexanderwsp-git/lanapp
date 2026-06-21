import { IdSchema, SheepIdParamSchema } from '@sheep/domain';
import { created, found, asyncHandler, validateParams } from '@sheep/server';
import { Router, Request, Response } from 'express';
import { SaleEvaluationService } from '../services/sale-evaluation.service';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const saleEvaluationService = new SaleEvaluationService();

router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(SheepIdParamSchema),
    asyncHandler(async (req, res) => {
        const evaluations = await saleEvaluationService.findBySheep(req.params.sheepId);
        found(res, evaluations);
    })
);

router.post(
    '/evaluate/:batchPeriod',
    verifyToken,
    asyncHandler(async (req, res) => {
        const evaluations = await saleEvaluationService.evaluateBatch(
            req.params.batchPeriod,
            req.user!.username
        );
        created(res, evaluations);
    })
);

export default router;
