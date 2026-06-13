import {
    SheepCreateSchema,
    SheepUpdateSchema,
    IdSchema,
    Gender,
    SheepStatus,
    SheepCategory,
    RecordType,
} from '@sheep/domain';
import { created, deleted, failed, found, foundPaginated, updated, asyncHandler, validateSchema, validateParams } from '@sheep/server';
import { Router, Request, Response } from 'express';
import { SheepService } from '../services';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const sheepService = new SheepService();

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const gender = req.query.gender as Gender | undefined;
        const status = req.query.status as SheepStatus | undefined;
        const category = req.query.category as SheepCategory | undefined;
        const locationId = req.query.locationId as string | undefined;

        if (gender || status || category || locationId) {
            const sheep = await sheepService.findFiltered({ gender, status, category, locationId });
            return found(res, sheep);
        }

        const result = await sheepService.findAll(page, limit);
        foundPaginated(res, result, page, limit);
    })
);

router.get(
    '/quarantine',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        const sheep = await sheepService.findInQuarantine();
        found(res, sheep);
    })
);

router.get(
    '/record-type/:type',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const recordType = req.params.type as RecordType;
        if (!Object.values(RecordType).includes(recordType)) {
            return failed(res, 'Invalid record type');
        }
        const sheep = await sheepService.findByRecordType(recordType);
        found(res, sheep);
    })
);

router.post(
    '/check-quarantine',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        await sheepService.checkQuarantineStatus();
        updated(res, { message: 'Quarantine status check completed' });
    })
);

router.get(
    '/:id/parents',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.findWithParents(req.params.id);
        if (!sheep) return failed(res, 'Sheep not found');
        found(res, sheep);
    })
);

router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.findOne(req.params.id);
        if (!sheep) return failed(res, 'Sheep not found');
        found(res, sheep);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(SheepCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.create(req.body, req.user!.username);
        created(res, sheep);
    })
);

router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(SheepUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.update(req.params.id, req.body, req.user!.username);
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await sheepService.delete(req.params.id);
        if (!result) return failed(res, 'Sheep not found');
        deleted(res);
    })
);

router.patch(
    '/:id/status',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { status } = req.body;
        const sheep = await sheepService.updateStatus(req.params.id, status, req.user!.username);
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

export default router;
