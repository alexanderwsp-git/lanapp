import { MigrationInterface, QueryRunner } from 'typeorm';

export class FarmParameters1749700000000 implements MigrationInterface {
    name = 'FarmParameters1749700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "lanapp"."farm_parameters" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL DEFAULT 'system',
                "updated_by" character varying,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "gestationDays" integer NOT NULL DEFAULT 147,
                "ecoCheckMinDays" integer NOT NULL DEFAULT 30,
                "ecoCheckMaxDays" integer NOT NULL DEFAULT 45,
                "heatCycleDays" integer NOT NULL DEFAULT 15,
                "weaningDays" integer NOT NULL DEFAULT 70,
                CONSTRAINT "PK_farm_parameters" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "lanapp"."farm_parameters" (
                "created_by", "updated_by",
                "gestationDays", "ecoCheckMinDays", "ecoCheckMaxDays", "heatCycleDays", "weaningDays"
            ) VALUES (
                'system', 'system',
                147, 30, 45, 15, 70
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "lanapp"."farm_parameters"`);
    }
}
