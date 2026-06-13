import {
    MedicineApplicationCreateSchema,
    MedicineApplicationUpdateSchema,
    BulkMedicineScheduleSchema,
    IdSchema,
} from '@sheep/domain';
import {
    created,
    deleted,
    failed,
    found,
    foundPaginated,
    updated,
    asyncHandler,
    validateSchema,
    validateParams,
} from '@sheep/server';
import { Router, Request, Response } from 'express';
import { MedicineApplicationService } from '../services';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const medicineApplicationService = new MedicineApplicationService();

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await medicineApplicationService.findAll(page, limit);
        foundPaginated(res, result, page, limit);
    })
);

router.get(
    '/pending',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        const applications = await medicineApplicationService.findPending();
        found(res, applications);
    })
);

router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const applications = await medicineApplicationService.findBySheep(req.params.sheepId);
        found(res, applications);
    })
);

router.get(
    '/:id/details',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const application = await medicineApplicationService.findWithDetails(req.params.id);
        if (!application) return failed(res, 'Medicine application not found');
        found(res, application);
    })
);

router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const application = await medicineApplicationService.findOne(req.params.id);
        if (!application) return failed(res, 'Medicine application not found');
        found(res, application);
    })
);

router.post(
    '/bulk/schedule',
    verifyToken,
    validateSchema(BulkMedicineScheduleSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await medicineApplicationService.bulkSchedule(
            req.body,
            req.user!.username
        );
        created(res, result);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(MedicineApplicationCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const application = await medicineApplicationService.create(req.body, req.user!.username);
        created(res, application);
    })
);

router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(MedicineApplicationUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const application = await medicineApplicationService.update(
            req.params.id,
            req.body,
            req.user!.username
        );
        if (!application) return failed(res, 'Medicine application not found');
        updated(res, application);
    })
);

router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await medicineApplicationService.delete(req.params.id);
        if (!result) return failed(res, 'Medicine application not found');
        deleted(res);
    })
);

export default router;
