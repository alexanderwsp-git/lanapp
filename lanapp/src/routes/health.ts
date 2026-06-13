import { ok } from '@sheep/server';
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    ok(res, { status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
