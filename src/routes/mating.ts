import { Router, Request, Response } from 'express';
import { MatingService } from '../services';
import { MatingSchema, IdSchema, created, failed, found, updated } from '@alexanderwsp-git/awsp-utils';
import { asyncHandler, validateSchema, validateParams } from '@alexanderwsp-git/awsp-utils';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const matingService = new MatingService();

// Get all matings with pagination
router.get(
    '/',
    verifyToken,
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
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.findWithDetails(req.params.id);
        if (!mating) return failed(res, 'Mating not found');
        found(res, mating);
    })
);

// Create new mating
router.post(
    '/',
    verifyToken,
    validateSchema(MatingSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const mating = await matingService.recordMating(req.body, req.user!.username);
        created(res, mating);
    })
);

// Mark mating as effective
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

// Mark mating as ineffective
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

// Get matings by status
router.get(
    '/status/:status',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const matings = await matingService.findByStatus(req.params.status as any);
        found(res, matings);
    })
);

// Get matings by male
router.get(
    '/male/:maleId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const matings = await matingService.findByMale(req.params.maleId);
        found(res, matings);
    })
);

// Get matings by female
router.get(
    '/female/:femaleId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const matings = await matingService.findByFemale(req.params.femaleId);
        found(res, matings);
    })
);

// Get matings by sheep (either male or female)
router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const matings = await matingService.findBySheep(req.params.sheepId);
        found(res, matings);
    })
);

export default router;
