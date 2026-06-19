import {
    AnalysisCreateSchema,
    AnalysisTypeCreateSchema,
    AnalysisTypeUpdateSchema,
    AnalysisUpdateSchema,
    BulkAnalysisScheduleSchema,
    IdSchema,
    SheepIdParamSchema,
} from '@sheep/domain';
import {
    created,
    deleted,
    failed,
    found,
    foundPaginated,
    updated,
    asyncHandler,
    validateSchema,
    validateParams,
} from '@sheep/server';
import { Router, Request, Response } from 'express';
import { AnalysisService } from '../services/analysis.service';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const analysisService = new AnalysisService();

router.get(
    '/pending',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        const items = await analysisService.findPending();
        found(res, items);
    })
);

router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(SheepIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const items = await analysisService.findBySheep(req.params.sheepId);
        found(res, items);
    })
);

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        const result = await analysisService.findAllWithRelations(page, limit);
        foundPaginated(res, result, page, limit);
    })
);

router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const item = await analysisService.findWithRelations(req.params.id);
        if (!item) return failed(res, 'Analysis not found');
        found(res, item);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(AnalysisCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const item = await analysisService.create(req.body, req.user!.username);
        created(res, item);
    })
);

router.post(
    '/bulk/schedule',
    verifyToken,
    validateSchema(BulkAnalysisScheduleSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await analysisService.bulkSchedule(req.body, req.user!.username);
        created(res, result);
    })
);

router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(AnalysisUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const item = await analysisService.update(req.params.id, req.body, req.user!.username);
        if (!item) return failed(res, 'Analysis not found');
        updated(res, item);
    })
);

router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const ok = await analysisService.delete(req.params.id);
        if (!ok) return failed(res, 'Analysis not found');
        deleted(res);
    })
);

export default router;
