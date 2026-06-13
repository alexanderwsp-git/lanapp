import {
    IdSchema,
    LocationCreateSchema,
    LocationUpdateSchema,
} from '@sheep/domain';
import {
    asyncHandler,
    created,
    deleted,
    failed,
    found,
    foundPaginated,
    updated,
    validateParams,
    validateSchema,
} from '@sheep/server';
import { Router, Request, Response } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';

import { LocationService } from '../services';

const router = Router();
const locationService = new LocationService();

router.post(
    '/',
    verifyToken,
    validateSchema(LocationCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const location = await locationService.create(req.body, req.user!.username);
        created(res, location);
    })
);

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if (req.query.page || req.query.limit) {
            const { name, type, status } = req.query;
            const result = await locationService.getPaginated(Number(page), Number(limit), {
                name,
                type,
                status,
            });
            foundPaginated(res, { data: result.data, total: result.pagination.total }, page, limit);
            return;
        }

        const locations = await locationService.findAll(1, 1000);
        foundPaginated(res, locations, 1, locations.total);
    })
);

router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const location = await locationService.findWithDetails(req.params.id);
        if (!location) return failed(res, 'Location not found');
        found(res, location);
    })
);

router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(LocationUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const location = await locationService.update(req.params.id, req.body, req.user!.username);
        if (!location) return failed(res, 'Location not found');
        updated(res, location);
    })
);

router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await locationService.delete(req.params.id);
        if (!result) return failed(res, 'Location not found');
        deleted(res);
    })
);

export default router;
