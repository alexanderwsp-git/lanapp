import { MigrationInterface, QueryRunner } from 'typeorm';

export class SheepAiExtensions1749000000000 implements MigrationInterface {
    name = 'SheepAiExtensions1749000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "lanapp"."diagnosis_type_enum" AS ENUM('ECO', 'Control Monta', 'FAMACHA')`
        );
        await queryRunner.query(
            `CREATE TYPE "lanapp"."breeding_result_enum" AS ENUM('Pregnant', 'Empty', 'Recheck')`
        );

        await queryRunner.query(`
            CREATE TABLE "lanapp"."health_check" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_by" character varying NOT NULL,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sheepId" uuid NOT NULL,
                "checkDate" date NOT NULL,
                "famachaScore" integer NOT NULL,
                "aiSuggestedScore" integer,
                "imageUrl" character varying,
                "weight" numeric(5,2),
                "notes" character varying,
                "confirmedBy" character varying,
                CONSTRAINT "PK_health_check" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "lanapp"."breeding_cycle" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_by" character varying NOT NULL,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "eweId" uuid NOT NULL,
                "cycleName" character varying NOT NULL,
                "ramId" uuid,
                "matingDate" date NOT NULL,
                "diagnosisType" "lanapp"."diagnosis_type_enum",
                "diagnosisDate" date,
                "result" "lanapp"."breeding_result_enum",
                "vitaselApplied" boolean NOT NULL DEFAULT false,
                "expectedBirthDate" date,
                "actualBirthDate" date,
                "notes" character varying,
                CONSTRAINT "PK_breeding_cycle" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "lanapp"."weaning_record" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_by" character varying NOT NULL,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sheepId" uuid NOT NULL,
                "weaningDate" date NOT NULL,
                "weaningWeight" numeric(5,2) NOT NULL,
                "dailyGain" numeric(6,2),
                "lotId" character varying,
                "notes" character varying,
                CONSTRAINT "PK_weaning_record" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "lanapp"."sale_evaluation" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_by" character varying NOT NULL,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sheepId" uuid NOT NULL,
                "batchPeriod" character varying NOT NULL,
                "birthWeightAvg" numeric(5,2),
                "weaningWeight" numeric(5,2),
                "eligible" boolean NOT NULL,
                "reason" character varying,
                "evaluatedAt" date NOT NULL,
                CONSTRAINT "PK_sale_evaluation" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(
            `ALTER TABLE "lanapp"."weight" ADD "dailyGain" numeric(6,2)`
        );

        await queryRunner.query(
            `ALTER TABLE "lanapp"."health_check" ADD CONSTRAINT "FK_health_check_sheep" FOREIGN KEY ("sheepId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lanapp"."breeding_cycle" ADD CONSTRAINT "FK_breeding_cycle_ewe" FOREIGN KEY ("eweId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lanapp"."breeding_cycle" ADD CONSTRAINT "FK_breeding_cycle_ram" FOREIGN KEY ("ramId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lanapp"."weaning_record" ADD CONSTRAINT "FK_weaning_record_sheep" FOREIGN KEY ("sheepId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lanapp"."sale_evaluation" ADD CONSTRAINT "FK_sale_evaluation_sheep" FOREIGN KEY ("sheepId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lanapp"."sale_evaluation" DROP CONSTRAINT "FK_sale_evaluation_sheep"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."weaning_record" DROP CONSTRAINT "FK_weaning_record_sheep"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."breeding_cycle" DROP CONSTRAINT "FK_breeding_cycle_ram"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."breeding_cycle" DROP CONSTRAINT "FK_breeding_cycle_ewe"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."health_check" DROP CONSTRAINT "FK_health_check_sheep"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."weight" DROP COLUMN "dailyGain"`);
        await queryRunner.query(`DROP TABLE "lanapp"."sale_evaluation"`);
        await queryRunner.query(`DROP TABLE "lanapp"."weaning_record"`);
        await queryRunner.query(`DROP TABLE "lanapp"."breeding_cycle"`);
        await queryRunner.query(`DROP TABLE "lanapp"."health_check"`);
        await queryRunner.query(`DROP TYPE "lanapp"."breeding_result_enum"`);
        await queryRunner.query(`DROP TYPE "lanapp"."diagnosis_type_enum"`);
    }
}
