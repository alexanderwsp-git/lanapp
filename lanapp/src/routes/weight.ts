import { WeightCreateSchema, WeightUpdateSchema, IdSchema } from '@sheep/domain';
import { created, deleted, failed, found, foundPaginated, updated, asyncHandler, validateSchema, validateParams } from '@sheep/server';
import { Router, Request, Response } from 'express';
import { WeightService } from '../services';
import { SheepIdParamSchema } from '../schemas/params';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const weightService = new WeightService();

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await weightService.findAll(page, limit);
        foundPaginated(res, result, page, limit);
    })
);

router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(SheepIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weights = await weightService.findBySheep(req.params.sheepId);
        found(res, weights);
    })
);

router.get(
    '/sheep/:sheepId/latest',
    verifyToken,
    validateParams(SheepIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.findLatestBySheep(req.params.sheepId);
        if (!weight) return failed(res, 'No weight records found for this sheep');
        found(res, weight);
    })
);

router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.findOne(req.params.id);
        if (!weight) return failed(res, 'Weight not found');
        found(res, weight);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(WeightCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.recordWeight(req.body, req.user!.username);
        created(res, weight);
    })
);

router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(WeightUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.update(req.params.id, req.body, req.user!.username);
        if (!weight) return failed(res, 'Weight not found');
        updated(res, weight);
    })
);

router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await weightService.delete(req.params.id);
        if (!result) return failed(res, 'Weight not found');
        deleted(res);
    })
);

export default router;
