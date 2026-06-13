import { MigrationInterface, QueryRunner } from 'typeorm';

export class BreedingCycleStatus1749300000000 implements MigrationInterface {
    name = 'BreedingCycleStatus1749300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "lanapp"."breeding_cycle_status_enum" AS ENUM('Active', 'Cancelled')`
        );
        await queryRunner.query(
            `ALTER TABLE "lanapp"."breeding_cycle" ADD "status" "lanapp"."breeding_cycle_status_enum" NOT NULL DEFAULT 'Active'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lanapp"."breeding_cycle" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "lanapp"."breeding_cycle_status_enum"`);
    }
}
