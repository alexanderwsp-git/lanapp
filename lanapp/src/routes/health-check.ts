import { HealthCheckCreateSchema, HealthCheckUpdateSchema, IdSchema, SheepIdParamSchema } from '@sheep/domain';
import { created, deleted, failed, found, foundPaginated, updated, asyncHandler, validateSchema, validateParams } from '@sheep/server';
import { Router, Request, Response } from 'express';
import { HealthCheckService } from '../services/health-check.service';

import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const healthCheckService = new HealthCheckService();

router.get(
    '/',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const threshold = parseInt(req.query.threshold as string) || 3;
        if (req.query.alerts === 'true') {
            const checks = await healthCheckService.findHighScores(threshold);
            return found(res, checks);
        }
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await healthCheckService.findAll(page, limit);
        foundPaginated(res, result, page, limit);
    })
);

router.get(
    '/sheep/:sheepId',
    verifyToken,
    validateParams(SheepIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const checks = await healthCheckService.findBySheep(req.params.sheepId);
        found(res, checks);
    })
);

router.get(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const check = await healthCheckService.findOne(req.params.id);
        if (!check) return failed(res, 'Health check not found');
        found(res, check);
    })
);

router.post(
    '/',
    verifyToken,
    validateSchema(HealthCheckCreateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const check = await healthCheckService.recordCheck(req.body, req.user!.username);
        created(res, check);
    })
);

router.put(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    validateSchema(HealthCheckUpdateSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const check = await healthCheckService.update(req.params.id, req.body, req.user!.username);
        if (!check) return failed(res, 'Health check not found');
        updated(res, check);
    })
);

router.delete(
    '/:id',
    verifyToken,
    validateParams(IdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await healthCheckService.delete(req.params.id);
        if (!result) return failed(res, 'Health check not found');
        deleted(res);
    })
);

export default router;
