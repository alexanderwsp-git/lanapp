import { Router } from 'express';

import health from './health';
import auth from './auth';
import settings from './settings';
import users from './users';
import password from './password';

const router = Router();

router.use('/health', health);
router.use('/auth', auth);
router.use('/users', users);
router.use('/password', password);
router.use('/settings', settings);

export default router;
