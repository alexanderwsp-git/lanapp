import { Router, Request, Response } from 'express';
import { MedicineApplicationService } from '../services';
import { MedicineApplicationSchema, MedicineApplicationPartialSchema, IdSchema, created, deleted, failed, found, updated } from '@awsp__/utils';
import { asyncHandler, validateSchema, validateParams } from '@awsp__/utils';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const medicineApplicationService = new MedicineApplicationService();

// Get all medicine applications with pagination
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await medicineApplicationService.findAll(page, limit);
        found(res, result);
    })
);

// Get medicine application by ID
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

// Create new medicine application
router.post(
    '/',
    verifyToken,
    validateSchema(MedicineApplicationSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const application = await medicineApplicationService.create(req.body, req.user?.username || 'system');
        created(res, application);
    })
);

// Update medicine application
router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(MedicineApplicationPartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const application = await medicineApplicationService.update(req.params.id, req.body, req.user?.username || 'system');
        if (!application) return failed(res, 'Medicine application not found');
        updated(res, application);
    })
);

// Delete medicine application
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

// Get applications by sheep
router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const applications = await medicineApplicationService.findBySheep(req.params.sheepId);
        found(res, applications);
    })
);

// Get pending applications
router.get(
    '/pending',
    asyncHandler(async (req: Request, res: Response) => {
        const applications = await medicineApplicationService.findPending();
        found(res, applications);
    })
);

// Get application with details
router.get(
    '/:id/details',
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const application = await medicineApplicationService.findWithDetails(req.params.id);
        if (!application) return failed(res, 'Medicine application not found');
        found(res, application);
    })
);

export default router; 