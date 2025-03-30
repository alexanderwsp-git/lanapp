import { Router, Request, Response } from 'express';
import { SheepService } from '../services';
import {
    SheepSchema,
    SheepPartialSchema,
    IdSchema,
    created,
    deleted,
    failed,
    found,
    updated,
} from '@awsp__/utils';
import { asyncHandler, validateSchema, validateParams } from '@awsp__/utils';
import { verifyToken } from '../middlewares/auth.middleware';
import { RecordType, SheepStatus } from '@awsp__/utils';

const router = Router();
const sheepService = new SheepService();

// Get all sheep with pagination
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await sheepService.findAll(page, limit);
        found(res, result);
    })
);

// Get sheep by ID
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

// Create new sheep
router.post(
    '/',
    verifyToken,
    validateSchema(SheepSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.create(req.body, req.user!.username);
        created(res, sheep);
    })
);

// Update sheep
router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(SheepPartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.update(req.params.id, req.body, req.user!.username);
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

// Delete sheep
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

// Get sheep with parents
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

// Update sheep status
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

// Get sheep by record type
router.get(
    '/record-type/:type',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const recordType = req.params.type as RecordType;
        if (!Object.values(RecordType).includes(recordType)) {
            return failed(res, 'Invalid record type');
        }
        const sheep = await sheepService.findByRecordType(recordType);
        found(res, sheep);
    })
);

// Get sheep in quarantine
router.get(
    '/quarantine',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.findInQuarantine();
        found(res, sheep);
    })
);

// Check quarantine status (system endpoint)
router.post(
    '/check-quarantine',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        await sheepService.checkQuarantineStatus();
        updated(res, { message: 'Quarantine status check completed' });
    })
);

export default router;
