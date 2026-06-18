import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL ?? '';

const useRdsSsl = databaseUrl.includes('sslmode=require') || process.env.DATABASE_SSL === 'true';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl || undefined,
    synchronize: false,
    logging: !isProduction,
    schema: process.env.DATABASE_SCHEMA || 'public',
    entities: [isProduction ? 'dist/entities/**/*.js' : 'src/entities/**/*.ts'],
    migrations: [isProduction ? 'dist/migrations/**/*.js' : 'src/migrations/**/*.ts'],
    migrationsRun: true,
    ssl: useRdsSsl ? { rejectUnauthorized: false } : undefined,
    extra: {
        max: 10,
        idleTimeoutMillis: 30000,
    },
});
