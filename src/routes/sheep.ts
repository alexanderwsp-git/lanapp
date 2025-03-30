import { Router, Request, Response } from 'express';
import { SheepService } from '../services';
import { SheepSchema, SheepPartialSchema, IdSchema, created, deleted, failed, found, updated } from '@awsp__/utils';
import { asyncHandler, validateSchema, validateParams } from '@awsp__/utils';

const router = Router();
const sheepService = new SheepService();

// Get all sheep with pagination
router.get(
    '/',
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
    validateSchema(SheepSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.create(req.body, req.user?.username || 'system');
        created(res, sheep);
    })
);

// Update sheep
router.put(
    '/:id',
    validateParams(IdSchema),
    validateSchema(SheepPartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.update(req.params.id, req.body, req.user?.username || 'system');
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

// Delete sheep
router.delete(
    '/:id',
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
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { status } = req.body;
        const sheep = await sheepService.updateStatus(req.params.id, status, req.user?.username || 'system');
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

// Update breeding status
router.patch(
    '/:id/breeding-status',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { isBreedingAnimal } = req.body;
        const sheep = await sheepService.updateBreedingStatus(req.params.id, isBreedingAnimal, req.user?.username || 'system');
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

// Update malton status
router.patch(
    '/:id/malton-status',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { isMalton } = req.body;
        const sheep = await sheepService.updateMaltonStatus(req.params.id, isMalton, req.user?.username || 'system');
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

// Update breastfeeding status
router.patch(
    '/:id/breastfeeding-status',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { isBreastfeeding } = req.body;
        const sheep = await sheepService.updateBreastfeedingStatus(req.params.id, isBreastfeeding, req.user?.username || 'system');
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

export default router; 