import 'reflect-metadata';
import compression from 'compression';
import cors from 'cors';

import { AppDataSource } from './config/ormconfig';
import express from 'express';
import dotenv from 'dotenv';

import routes from './routes/index';
import { errorHandler, limiter, requestLogger } from '@awsp__/utils';

dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
    credentials: true,
};

app.use(compression());
app.use(cors(corsOptions));
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use('/api', routes);
app.use(errorHandler);

export { app };

if (process.env.NODE_ENV !== 'test') {
    const startServer = async () => {
        try {
            await AppDataSource.initialize();
            console.log('✅ Database connected!');

            app.listen(PORT, () => {
                console.log(`🚀 Server is running on port ${PORT}, TZ: ${process.env.TZ}`);
            });
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    };

    startServer();
}
