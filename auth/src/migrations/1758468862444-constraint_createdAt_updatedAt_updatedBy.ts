import { MigrationInterface, QueryRunner } from "typeorm";

export class ConstraintCreatedAtUpdatedAtUpdatedBy1758468862444 implements MigrationInterface {
    name = 'ConstraintCreatedAtUpdatedAtUpdatedBy1758468862444'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "general"."setting" ALTER COLUMN "updated_by" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "general"."setting" ALTER COLUMN "updated_by" SET NOT NULL`);
    }

}
