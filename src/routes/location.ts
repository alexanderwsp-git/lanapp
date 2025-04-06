import { Router, Request, Response } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '@awsp__/utils';
import { found, created, updated, deleted, failed } from '@awsp__/utils';
import { validateParams, validateSchema } from '@awsp__/utils';
import { IdSchema, LocationSchema, LocationPartialSchema } from '@awsp__/utils';
import { LocationService } from '../services';

const router = Router();
const locationService = new LocationService();

// Create location
router.post(
    '/',
    verifyToken,
    validateSchema(LocationSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const location = await locationService.create(req.body, req.user!.username);
        created(res, location);
    })
);

// Get all locations
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        // const locations = await locationService.findAll();
        // found(res, locations);
        const { page, limit, name, type, status } = req.query;

        const settings =
            page && limit
                ? await locationService.getPaginated(Number(page), Number(limit), {
                      name,
                      type,
                      status,
                  })
                : await locationService.findAll();

        found(res, settings);
    })
);

// Get location by ID
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

// Update location
router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(LocationPartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const location = await locationService.update(req.params.id, req.body, req.user!.username);
        if (!location) return failed(res, 'Location not found');
        updated(res, location);
    })
);

// Delete location
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
