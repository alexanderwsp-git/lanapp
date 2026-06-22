import { found, asyncHandler } from '@sheep/server';
import { Router, Request, Response } from 'express';

import { verifyToken } from '../middlewares/auth.middleware';
import { SheepService } from '../services/sheep.service';
import { MatingService } from '../services/mating.service';
import { BreedingCycleService } from '../services/breeding-cycle.service';
import { AnalysisService } from '../services/analysis.service';

const router = Router();
const sheepService = new SheepService();
const matingService = new MatingService();
const breedingCycleService = new BreedingCycleService();
const analysisService = new AnalysisService();

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
        const threshold = parseInt(req.query.threshold as string) || 2;
        const alerts = await analysisService.findFamachaAlerts(threshold);
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
        const [allSheep, pregnant, maltonas, quarantine, healthAlerts] = await Promise.all([
            sheepService.findAll(1, 1),
            sheepService.findPregnant(),
            sheepService.findMaltonas(),
            sheepService.findInQuarantine(),
            analysisService.findFamachaAlerts(2),
        ]);

        found(res, {
            totalSheep: allSheep.total,
            pregnantCount: pregnant.length,
            maltonasCount: maltonas.length,
            quarantineCount: quarantine.length,
            healthAlertCount: healthAlerts.length,
            generatedAt: new Date(),
        });
    })
);

export default router;
