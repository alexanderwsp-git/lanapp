import { MatingCreateSchema, BulkMatingScheduleSchema, IdSchema, MaleIdParamSchema, FemaleIdParamSchema, SheepIdParamSchema } from '@sheep/domain';
import {
    created,
    failed,
    found,
    foundPaginated,
    updated,
    asyncHandler,
    validateSchema,
    validateParams,
} from '@sheep/server';
import { Router, Request, Response } from 'express';
import { MatingService } from '../services';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const matingService = new MatingService();

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await matingService.findAll(page, limit);
        foundPaginated(res, result, page, limit);
    })
);

router.get(
    '/status/:status',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const matings = await matingService.findByStatus(req.params.status as any);
        found(res, matings);
    })
);

router.get(
    '/male/:maleId',
    verifyToken,
    validateParams(MaleIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const matings = await matingService.findByMale(req.params.maleId);
        found(res, matings);
    })
);

router.get(
    '/female/:femaleId',
    verifyToken,
    validateParams(FemaleIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const matings = await matingService.findByFemale(req.params.femaleId);
        found(res, matings);
    })
);

router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(SheepIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const matings = await matingService.findBySheep(req.params.sheepId);
        found(res, matings);
    })
);

router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.findWithDetails(req.params.id);
        if (!mating) return failed(res, 'Mating not found');
        found(res, mating);
    })
);

router.post(
    '/bulk',
    verifyToken,
    validateSchema(BulkMatingScheduleSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await matingService.bulkRecordMating(req.body, req.user!.username);
        created(res, result);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(MatingCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.recordMating(req.body, req.user!.username);
        created(res, mating);
    })
);

router.post(
    '/:id/effective',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.markAsEffective(req.params.id, req.user!.username);
        if (!mating) return failed(res, 'Mating not found');
        updated(res, mating);
    })
);

router.post(
    '/:id/ineffective',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.markAsIneffective(req.params.id, req.user!.username);
        if (!mating) return failed(res, 'Mating not found');
        updated(res, mating);
    })
);

export default router;
