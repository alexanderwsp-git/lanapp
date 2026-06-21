import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase3Features1750000000000 implements MigrationInterface {
    name = 'Phase3Features1750000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';

        await queryRunner.query(
            `ALTER TABLE "${schema}"."sheep" ADD COLUMN "breedingRamMarkedAt" date`
        );
        await queryRunner.query(
            `UPDATE "${schema}"."sheep" SET "breedingRamMarkedAt" = CURRENT_DATE WHERE "isBreedingRam" = true AND "breedingRamMarkedAt" IS NULL`
        );

        await queryRunner.query(
            `ALTER TABLE "${schema}"."pregnancy_check" ADD COLUMN "offspringBorn" integer`
        );
        await queryRunner.query(
            `ALTER TABLE "${schema}"."pregnancy_check" ADD COLUMN "offspringAlive" integer`
        );
        await queryRunner.query(
            `ALTER TABLE "${schema}"."pregnancy_check" ADD COLUMN "offspringLost" integer`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';

        await queryRunner.query(
            `ALTER TABLE "${schema}"."pregnancy_check" DROP COLUMN "offspringLost"`
        );
        await queryRunner.query(
            `ALTER TABLE "${schema}"."pregnancy_check" DROP COLUMN "offspringAlive"`
        );
        await queryRunner.query(
            `ALTER TABLE "${schema}"."pregnancy_check" DROP COLUMN "offspringBorn"`
        );
        await queryRunner.query(
            `ALTER TABLE "${schema}"."sheep" DROP COLUMN "breedingRamMarkedAt"`
        );
    }
}
