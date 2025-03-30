import { Router, Request, Response } from 'express';
import { MatingService } from '../services';
import { MatingSchema, MatingPartialSchema, IdSchema, created, deleted, failed, found, updated } from '@awsp__/utils';
import { asyncHandler, validateSchema, validateParams } from '@awsp__/utils';

const router = Router();
const matingService = new MatingService();

// Get all matings with pagination
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await matingService.findAll(page, limit);
        found(res, result);
    })
);

// Get mating by ID
router.get(
    '/:id',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.findOne(req.params.id);
        if (!mating) return failed(res, 'Mating not found');
        found(res, mating);
    })
);

// Create new mating
router.post(
    '/',
    validateSchema(MatingSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.recordMating(req.body, req.user?.username || 'system');
        created(res, mating);
    })
);

// Update mating
router.put(
    '/:id',
    validateParams(IdSchema),
    validateSchema(MatingPartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.update(req.params.id, req.body, req.user?.username || 'system');
        if (!mating) return failed(res, 'Mating not found');
        updated(res, mating);
    })
);

// Delete mating
router.delete(
    '/:id',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await matingService.delete(req.params.id);
        if (!result) return failed(res, 'Mating not found');
        deleted(res);
    })
);

// Mark mating as effective
router.post(
    '/:id/effective',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.markAsEffective(req.params.id, req.user?.username || 'system');
        if (!mating) return failed(res, 'Mating not found');
        updated(res, mating);
    })
);

// Mark mating as ineffective
router.post(
    '/:id/ineffective',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.markAsIneffective(req.params.id, req.user?.username || 'system');
        if (!mating) return failed(res, 'Mating not found');
        updated(res, mating);
    })
);

// Increment mating count
router.post(
    '/:id/increment-count',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.incrementMatingCount(req.params.id, req.user?.username || 'system');
        if (!mating) return failed(res, 'Mating not found');
        updated(res, mating);
    })
);

export default router; 