import { Router } from 'express';
import health from './health';
import sheep from './sheep';
import medicine from './medicine';
import medicineApplication from './medicine-application';
import mating from './mating';
import weight from './weight';
import pregnancyCheckRoutes from './pregnancy-check';
import location from './location';

const router = Router();

router.use('/health', health);
router.use('/sheep', sheep);
router.use('/medicine', medicine);
router.use('/medicine-application', medicineApplication);
router.use('/mating', mating);
router.use('/weight', weight);
router.use('/pregnancy-check', pregnancyCheckRoutes);
router.use('/location', location);

export default router;
