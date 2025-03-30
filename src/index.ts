import 'reflect-metadata';
import compression from 'compression';
import cors from 'cors';

import { AppDataSource } from './config/ormconfig';
import express from 'express';
import dotenv from 'dotenv';

import routes from './routes';
import { errorHandler, limiter, requestLogger } from '@awsp__/utils';

dotenv.config();

const app = express();
const port = process.env.PORT || 2080;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(requestLogger);
app.use(limiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Database connection and server start
AppDataSource.initialize()
    .then(() => {
        console.log('Data Source has been initialized!');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => console.log('Error during Data Source initialization:', error));

export { app }; 