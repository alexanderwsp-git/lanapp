import { Router, Request, Response } from 'express';
import { SheepService } from '../services/sheepService';
import {
    asyncHandler,
    created,
    deleted,
    failed,
    found,
    IdSchema,
    updated,
    validateParams,
    validateSchema,
    SheepSchema,
    SheepPartialSchema,
} from '@awsp__/utils';

const router = Router();
const sheepService = new SheepService();

router.post(
    '/',
    validateSchema(SheepSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.createSheep(req.body);
        created(res, sheep);
    })
);

router.get(
    '/',
    asyncHandler(async (req: Request, res: Response): Promise<any> => {
        const { page, limit, tag, name, breed, gender, isActive } = req.query;

        const sheep =
            page && limit
                ? await sheepService.getPaginatedSheep(
                      Number(page),
                      Number(limit),
                      { tag, name, breed, gender, isActive }
                  )
                : await sheepService.getAllSheep();

        found(res, sheep);
    })
);

router.get(
    '/:id',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.getSheepById(req.params.id);
        if (!sheep) return failed(res, 'Sheep not found');
        found(res, sheep);
    })
);

router.put(
    '/:id',
    validateParams(IdSchema),
    validateSchema(SheepPartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const sheep = await sheepService.updateSheep(
            req.params.id,
            req.body
        );
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

router.delete(
    '/:id',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const success = await sheepService.deleteSheep(req.params.id);
        if (!success) return failed(res, 'Sheep not found');
        deleted(res);
    })
);

// Special endpoints for sheep-specific operations
router.put(
    '/:id/weight',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { weight } = req.body;
        if (typeof weight !== 'number') {
            return failed(res, 'Weight must be a number');
        }
        const sheep = await sheepService.updateSheepWeight(
            req.params.id,
            weight
        );
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

router.put(
    '/:id/mount',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { date } = req.body;
        if (!date) {
            return failed(res, 'Mounting date is required');
        }
        const sheep = await sheepService.updateSheepMountingDate(
            req.params.id,
            new Date(date)
        );
        if (!sheep) return failed(res, 'Sheep not found');
        updated(res, sheep);
    })
);

export default router; 