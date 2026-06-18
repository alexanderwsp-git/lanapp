import { MigrationInterface, QueryRunner } from 'typeorm';

export class PregnancyCheckType1749500000000 implements MigrationInterface {
    name = 'PregnancyCheckType1749500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "lanapp"."pregnancy_check" ADD "checkType" "lanapp"."diagnosis_type_enum"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lanapp"."pregnancy_check" DROP COLUMN "checkType"`);
    }
}
