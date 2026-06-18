import { MigrationInterface, QueryRunner } from 'typeorm';

export class BreedingCycleMatingId1749400000000 implements MigrationInterface {
    name = 'BreedingCycleMatingId1749400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "lanapp"."breeding_cycle" ADD "matingId" uuid`
        );
        await queryRunner.query(
            `ALTER TABLE "lanapp"."breeding_cycle" ADD CONSTRAINT "FK_breeding_cycle_mating" FOREIGN KEY ("matingId") REFERENCES "lanapp"."mating"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "lanapp"."breeding_cycle" DROP CONSTRAINT "FK_breeding_cycle_mating"`
        );
        await queryRunner.query(`ALTER TABLE "lanapp"."breeding_cycle" DROP COLUMN "matingId"`);
    }
}
