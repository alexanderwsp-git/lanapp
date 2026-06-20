import { AppDataSource } from '../config/ormconfig';
import { runDemoSeed } from './demo.seed';

async function main(): Promise<void> {
    const force = process.env.DEMO_SEED_FORCE === 'true';
    await AppDataSource.initialize();
    try {
        await runDemoSeed(AppDataSource, { force });
    } finally {
        await AppDataSource.destroy();
    }
}

main().catch(err => {
    console.error('Demo seed failed:', err);
    process.exit(1);
});
