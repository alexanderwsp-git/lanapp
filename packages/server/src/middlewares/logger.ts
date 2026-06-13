import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

import { Request, Response, NextFunction } from 'express';

const logDirectory = path.join(__dirname, '../../logs');

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.Http(),
        new DailyRotateFile({
            filename: path.join(logDirectory, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '7d',
        }),
    ],
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
};
