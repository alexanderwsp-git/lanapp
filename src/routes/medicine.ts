import { Router, Request, Response } from 'express';
import { MedicineService } from '../services';
import {
    MedicineSchema,
    MedicinePartialSchema,
    IdSchema,
    created,
    deleted,
    failed,
    found,
    updated,
} from '@awsp__/utils';
import { asyncHandler, validateSchema, validateParams } from '@awsp__/utils';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const medicineService = new MedicineService();

// Get all medicines with pagination
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await medicineService.findAll(page, limit);
        found(res, result);
    })
);

// Get medicine by ID
router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const medicine = await medicineService.findOne(req.params.id);
        if (!medicine) return failed(res, 'Medicine not found');
        found(res, medicine);
    })
);

// Create new medicine
router.post(
    '/',
    verifyToken,
    validateSchema(MedicineSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const medicine = await medicineService.create(req.body, req.user!.username);
        created(res, medicine);
    })
);

// Update medicine
router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(MedicinePartialSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const medicine = await medicineService.update(req.params.id, req.body, req.user!.username);
        if (!medicine) return failed(res, 'Medicine not found');
        updated(res, medicine);
    })
);

// Delete medicine
router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await medicineService.delete(req.params.id);
        if (!result) return failed(res, 'Medicine not found');
        deleted(res);
    })
);

// Get medicine with applications
router.get(
    '/:id/applications',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const medicine = await medicineService.findWithApplications(req.params.id);
        if (!medicine) return failed(res, 'Medicine not found');
        found(res, medicine);
    })
);

export default router;
