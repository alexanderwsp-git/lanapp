import { MigrationInterface, QueryRunner } from "typeorm";

export class SettingEntity1743361727123 implements MigrationInterface {
    name = 'SettingEntity1743361727123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "general"."setting" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_by" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "config" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'Active', CONSTRAINT "UQ_27923d152bbf82683ab795d5476" UNIQUE ("name"), CONSTRAINT "PK_fcb21187dc6094e24a48f677bed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_27923d152bbf82683ab795d547" ON "general"."setting" ("name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "general"."IDX_27923d152bbf82683ab795d547"`);
        await queryRunner.query(`DROP TABLE "general"."setting"`);
    }

}
