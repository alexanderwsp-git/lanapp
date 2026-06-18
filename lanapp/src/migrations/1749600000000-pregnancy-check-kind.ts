import { MigrationInterface, QueryRunner } from 'typeorm';

export class PregnancyCheckKind1749600000000 implements MigrationInterface {
    name = 'PregnancyCheckKind1749600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "lanapp"."pregnancy_check_kind_enum" AS ENUM('Diagnosis', 'Delivery')`
        );
        await queryRunner.query(
            `ALTER TABLE "lanapp"."pregnancy_check" ADD "kind" "lanapp"."pregnancy_check_kind_enum" NOT NULL DEFAULT 'Diagnosis'`
        );
        // Backfill parto rows that were stored as false ECO checks
        await queryRunner.query(`
            UPDATE "lanapp"."pregnancy_check" pc
            SET "kind" = 'Delivery'
            WHERE pc."isPregnant" = false
              AND (
                pc.notes ILIKE '%parto registrado%'
                OR pc.notes ILIKE '%parto%'
              )
              AND EXISTS (
                SELECT 1 FROM "lanapp"."pregnancy_check" prior
                WHERE prior."matingId" = pc."matingId"
                  AND prior."isPregnant" = true
                  AND prior."checkDate" <= pc."checkDate"
              )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lanapp"."pregnancy_check" DROP COLUMN "kind"`);
        await queryRunner.query(`DROP TYPE "lanapp"."pregnancy_check_kind_enum"`);
    }
}
