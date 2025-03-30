import { Router, Request, Response } from 'express';
import { WeightService } from '../services';
import { WeightSchema, WeightPartialSchema, IdSchema, created, deleted, failed, found, updated } from '@awsp__/utils';
import { asyncHandler, validateSchema, validateParams } from '@awsp__/utils';

const router = Router();
const weightService = new WeightService();

// Get all weights with pagination
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await weightService.findAll(page, limit);
        found(res, result);
    })
);

// Get weight by ID
router.get(
    '/:id',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.findOne(req.params.id);
        if (!weight) return failed(res, 'Weight record not found');
        found(res, weight);
    })
);

// Create new weight record
router.post(
    '/',
    validateSchema(WeightSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.create(req.body, req.user?.username || 'system');
        created(res, weight);
    })
);

// Update weight record
router.put(
    '/:id',
    validateParams(IdSchema),
    validateSchema(WeightPartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.update(req.params.id, req.body, req.user?.username || 'system');
        if (!weight) return failed(res, 'Weight record not found');
        updated(res, weight);
    })
);

// Delete weight record
router.delete(
    '/:id',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await weightService.delete(req.params.id);
        if (!result) return failed(res, 'Weight record not found');
        deleted(res);
    })
);

// Get weight history for a sheep
router.get(
    '/sheep/:sheepId',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const history = await weightService.getWeightHistory(req.params.sheepId);
        found(res, history);
    })
);

// Get latest weight for a sheep
router.get(
    '/sheep/:sheepId/latest',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const latest = await weightService.findLatestBySheep(req.params.sheepId);
        if (!latest) return failed(res, 'No weight records found for this sheep');
        found(res, latest);
    })
);

export default router; 