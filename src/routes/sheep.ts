import { Router, Request, Response } from 'express';
import { SheepService } from '../services';
import { SheepSchema, SheepPartialSchema, IdSchema, created, deleted, failed, found, updated } from '@awsp__/utils';
import { asyncHandler, validateSchema, validateParams } from '@awsp__/utils';
import { verifyToken } from '../middlewares/auth.middleware';

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

// Update breeding status
router.patch(
    '/:id/breeding-status',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { isBreedingAnimal } = req.body;
        const sheep = await sheepService.updateBreedingStatus(req.params.id, isBreedingAnimal, req.user!.username);
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

// Update malton status
router.patch(
    '/:id/malton-status',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { isMalton } = req.body;
        const sheep = await sheepService.updateMaltonStatus(req.params.id, isMalton, req.user!.username);
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

// Update breastfeeding status
router.patch(
    '/:id/breastfeeding-status',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { isBreastfeeding } = req.body;
        const sheep = await sheepService.updateBreastfeedingStatus(req.params.id, isBreastfeeding, req.user!.username);
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

export default router; 