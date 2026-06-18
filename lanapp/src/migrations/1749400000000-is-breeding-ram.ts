import { MigrationInterface, QueryRunner } from 'typeorm';

export class IsBreedingRam1749400000000 implements MigrationInterface {
    name = 'IsBreedingRam1749400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'public';
        await queryRunner.query(
            `ALTER TABLE "${schema}"."sheep" ADD COLUMN "isBreedingRam" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'public';
        await queryRunner.query(`ALTER TABLE "${schema}"."sheep" DROP COLUMN "isBreedingRam"`);
    }
}
