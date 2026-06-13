import { found, asyncHandler } from '@sheep/server';
import { Router, Request, Response } from 'express';

import { verifyToken } from '../middlewares/auth.middleware';
import { SheepService } from '../services/sheep.service';
import { MatingService } from '../services/mating.service';
import { HealthCheckService } from '../services/health-check.service';
import { BreedingCycleService } from '../services/breeding-cycle.service';

const router = Router();
const sheepService = new SheepService();
const matingService = new MatingService();
const healthCheckService = new HealthCheckService();
const breedingCycleService = new BreedingCycleService();

router.get(
    '/maltonas',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        const maltonas = await sheepService.findMaltonas();
        found(res, {
            title: 'Maltonas',
            generatedAt: new Date(),
            count: maltonas.length,
            data: maltonas.map(s => ({
                id: s.id,
                tag: s.tag,
                name: s.name,
                weight: s.weight,
                category: s.category,
                birthDate: s.birthDate,
            })),
        });
    })
);

router.get(
    '/prenadas',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        const pregnant = await sheepService.findPregnant();
        found(res, {
            title: 'Preñadas',
            generatedAt: new Date(),
            count: pregnant.length,
            data: pregnant.map(s => ({
                id: s.id,
                tag: s.tag,
                name: s.name,
                pregnancyConfirmedAt: s.pregnancyConfirmedAt,
                lastMountedDate: s.lastMountedDate,
                category: s.category,
            })),
        });
    })
);

router.get(
    '/montas',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const cycleName = (req.query.cycleName as string) || 'current';
        const cycles = await breedingCycleService.findByCycleName(cycleName);
        const matings = await matingService.findAll(1, 100);
        found(res, {
            title: 'Montas',
            generatedAt: new Date(),
            cycleName,
            breedingCycles: cycles,
            matings: matings.data,
        });
    })
);

router.get(
    '/famacha',
    verifyToken,
    asyncHandler(async (req: Request, res: Response) => {
        const threshold = parseInt(req.query.threshold as string) || 3;
        const alerts = await healthCheckService.findHighScores(threshold);
        found(res, {
            title: 'FAMACHA',
            generatedAt: new Date(),
            alertCount: alerts.length,
            data: alerts,
        });
    })
);

router.get(
    '/dashboard',
    verifyToken,
    asyncHandler(async (_req: Request, res: Response) => {
        const [allSheep, pregnant, quarantine, healthAlerts] = await Promise.all([
            sheepService.findAll(1, 1),
            sheepService.findPregnant(),
            sheepService.findInQuarantine(),
            healthCheckService.findHighScores(3),
        ]);

        found(res, {
            totalSheep: allSheep.total,
            pregnantCount: pregnant.length,
            quarantineCount: quarantine.length,
            healthAlertCount: healthAlerts.length,
            generatedAt: new Date(),
        });
    })
);

export default router;
