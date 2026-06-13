import { created, found, asyncHandler } from '@sheep/server';
import { Router, Request, Response } from 'express';
import multer from 'multer';

import { verifyToken } from '../middlewares/auth.middleware';
import { ImportService } from '../services/import.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const importService = new ImportService();

router.post(
    '/inventory/preview',
    verifyToken,
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        const preview = importService.parseInventoryFile(req.file.buffer);
        found(res, preview);
    })
);

router.post(
    '/inventory',
    verifyToken,
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        const result = await importService.importInventory(req.file.buffer, req.user!.username);
        created(res, result);
    })
);

router.post(
    '/famacha',
    verifyToken,
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        const result = await importService.importFamacha(req.file.buffer, req.user!.username);
        created(res, result);
    })
);

export default router;
