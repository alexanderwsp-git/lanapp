import { AnalysisTypeCreateSchema, AnalysisTypeUpdateSchema, IdSchema } from '@sheep/domain';
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
import { AnalysisTypeService } from '../services/analysis-type.service';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const analysisTypeService = new AnalysisTypeService();

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        const result = await analysisTypeService.findAll(page, limit);
        foundPaginated(res, result, page, limit);
    })
);

router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const item = await analysisTypeService.findOne(req.params.id);
        if (!item) return failed(res, 'Analysis type not found');
        found(res, item);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(AnalysisTypeCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const item = await analysisTypeService.create(req.body, req.user!.username);
        created(res, item);
    })
);

router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(AnalysisTypeUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const item = await analysisTypeService.update(req.params.id, req.body, req.user!.username);
        if (!item) return failed(res, 'Analysis type not found');
        updated(res, item);
    })
);

router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const ok = await analysisTypeService.delete(req.params.id);
        if (!ok) return failed(res, 'Analysis type not found');
        deleted(res);
    })
);

export default router;
