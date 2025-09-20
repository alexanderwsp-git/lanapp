import { Router } from 'express';
import { ok } from '@alexanderwsp-git/awsp-utils';

const router = Router();

router.get('/', (req, res) => {
    ok(res, { status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
