import { ReproductionParametersSchema } from '@sheep/domain';
import { asyncHandler, found, updated, validateSchema } from '@sheep/server';
import { Router, Request, Response } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { FarmParametersService } from '../services/farm-parameters.service';

const router = Router();
const farmParametersService = new FarmParametersService();

router.get(
    '/',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        const params = await farmParametersService.getParameters();
        found(res, params);
    })
);

router.put(
    '/',
    verifyToken,
    validateSchema(ReproductionParametersSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const params = await farmParametersService.updateParameters(
            req.body,
            req.user!.username
        );
        updated(res, params);
    })
);

export default router;
