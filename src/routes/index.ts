import { Router } from 'express';
import sheepRoutes from './sheep';

const router = Router();

router.use('/sheep', sheepRoutes);

export default router; 