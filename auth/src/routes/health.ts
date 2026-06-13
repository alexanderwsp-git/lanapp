import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toLocaleString('en-US', {
            timeZone: 'America/Guayaquil',
        }),
        uptime: process.uptime(),
        message: 'Service is running',
    });
});

export default router;
