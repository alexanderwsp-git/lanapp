import { Router } from 'express';
import { ok } from '@awsp__/utils';

const router = Router();

router.get('/', (req, res) => {
    ok(res, { status: 'ok', timestamp: new Date().toISOString() });
});

export default router; 