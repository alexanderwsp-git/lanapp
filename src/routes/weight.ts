import { Router, Request, Response } from 'express';
import { WeightService } from '../services';
import {
    WeightSchema,
    WeightPartialSchema,
    IdSchema,
    created,
    deleted,
    failed,
    found,
    updated,
} from '@alexanderwsp-git/awsp-utils';
import { asyncHandler, validateSchema, validateParams } from '@alexanderwsp-git/awsp-utils';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const weightService = new WeightService();

// Get all weights with pagination
router.get(
    '/',
    verifyToken,
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
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.findOne(req.params.id);
        if (!weight) return failed(res, 'Weight not found');
        found(res, weight);
    })
);

// Create new weight
router.post(
    '/',
    verifyToken,
    validateSchema(WeightSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.create(req.body, req.user!.username);
        created(res, weight);
    })
);

// Update weight
router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(WeightPartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.update(req.params.id, req.body, req.user!.username);
        if (!weight) return failed(res, 'Weight not found');
        updated(res, weight);
    })
);

// Delete weight
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

// Get weight history for a sheep
router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weights = await weightService.findBySheep(req.params.sheepId);
        found(res, weights);
    })
);

// Get latest weight for a sheep
router.get(
    '/sheep/:sheepId/latest',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const weight = await weightService.findLatestBySheep(req.params.sheepId);
        if (!weight) return failed(res, 'No weight records found for this sheep');
        found(res, weight);
    })
);

export default router;
