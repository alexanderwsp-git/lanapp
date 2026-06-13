import rateLimit from 'express-rate-limit';

const skipRateLimit =
    process.env.SKIP_RATE_LIMIT === 'true' || process.env.NODE_ENV !== 'production';

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: skipRateLimit ? 10_000 : 100,
    skip: () => skipRateLimit,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
