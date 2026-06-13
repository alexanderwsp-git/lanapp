import {
    BreedingCycleCreateSchema,
    BreedingCycleUpdateSchema,
    BulkBreedingCycleScheduleSchema,
    IdSchema,
} from '@sheep/domain';
import { created, deleted, failed, found, foundPaginated, updated, asyncHandler, validateSchema, validateParams } from '@sheep/server';
import { Router, Request, Response } from 'express';
import { BreedingCycleService } from '../services/breeding-cycle.service';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const breedingCycleService = new BreedingCycleService();

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const cycleName = req.query.cycleName as string;
        if (cycleName) {
            const cycles = await breedingCycleService.findByCycleName(cycleName);
            return found(res, cycles);
        }
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await breedingCycleService.findAll(page, limit);
        foundPaginated(res, result, page, limit);
    })
);

router.get(
    '/ewe/:eweId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const cycles = await breedingCycleService.findByEwe(req.params.eweId);
        found(res, cycles);
    })
);

router.post(
    '/bulk',
    verifyToken,
    validateSchema(BulkBreedingCycleScheduleSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await breedingCycleService.bulkSchedule(req.body, req.user!.username);
        created(res, result);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(BreedingCycleCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const cycle = await breedingCycleService.create(req.body, req.user!.username);
        created(res, cycle);
    })
);

router.patch(
    '/:id/diagnosis',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const cycle = await breedingCycleService.recordDiagnosis(
            req.params.id,
            req.body,
            req.user!.username
        );
        if (!cycle) return failed(res, 'Breeding cycle not found');
        updated(res, cycle);
    })
);

router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(BreedingCycleUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const cycle = await breedingCycleService.update(req.params.id, req.body, req.user!.username);
        if (!cycle) return failed(res, 'Breeding cycle not found');
        updated(res, cycle);
    })
);

router.post(
    '/:id/cancel',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const cycle = await breedingCycleService.cancel(req.params.id, req.user!.username);
            if (!cycle) return failed(res, 'Breeding cycle not found');
            updated(res, cycle);
        } catch (err) {
            failed(res, err instanceof Error ? err.message : 'No se pudo cancelar el ciclo');
        }
    })
);

router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const cycle = await breedingCycleService.cancel(req.params.id, req.user!.username);
            if (!cycle) return failed(res, 'Breeding cycle not found');
            deleted(res);
        } catch (err) {
            failed(res, err instanceof Error ? err.message : 'No se pudo cancelar el ciclo');
        }
    })
);

export default router;
