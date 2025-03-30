import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: !isProduction,
    schema: process.env.DATABASE_SCHEMA || 'public',
    entities: [isProduction ? 'dist/entities/**/*.js' : 'src/entities/**/*.ts'],
    migrations: [
        isProduction ? 'dist/migrations/**/*.js' : 'src/migrations/**/*.ts',
    ],
    migrationsRun: true,
    extra: {
        max: 10,
        idleTimeoutMillis: 30000,
    },
});
