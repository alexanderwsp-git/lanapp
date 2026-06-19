import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnalysisAndPregnancyDiagnosis1749800000000 implements MigrationInterface {
    name = 'AnalysisAndPregnancyDiagnosis1749800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';

        await queryRunner.query(
            `CREATE TYPE "${schema}"."analysis_kind_enum" AS ENUM('FAMACHA', 'COPROLOGICAL', 'BODY_CONDITION', 'BLOOD', 'OTHER')`
        );
        await queryRunner.query(
            `CREATE TYPE "${schema}"."analysis_status_enum" AS ENUM('Scheduled', 'Completed', 'Cancelled', 'Missed')`
        );

        await queryRunner.query(`
            CREATE TABLE "${schema}"."analysis_type" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_by" character varying NOT NULL,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "${schema}"."analysis_kind_enum" NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "defaultUnit" character varying,
                "recommendedMedicineType" "${schema}"."medicine_type_enum",
                CONSTRAINT "PK_analysis_type" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "${schema}"."analysis" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_by" character varying NOT NULL,
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "analysisTypeId" uuid NOT NULL,
                "sheepId" uuid NOT NULL,
                "scheduledDate" date NOT NULL,
                "completedDate" date,
                "status" "${schema}"."analysis_status_enum" NOT NULL DEFAULT 'Scheduled',
                "resultValue" character varying,
                "famachaScore" integer,
                "diagnosis" character varying,
                "notes" character varying,
                CONSTRAINT "PK_analysis" PRIMARY KEY ("id"),
                CONSTRAINT "FK_analysis_type" FOREIGN KEY ("analysisTypeId") REFERENCES "${schema}"."analysis_type"("id"),
                CONSTRAINT "FK_analysis_sheep" FOREIGN KEY ("sheepId") REFERENCES "${schema}"."sheep"("id")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "${schema}"."analysis_type" ("created_by", "updated_by", "type", "name", "description", "defaultUnit", "recommendedMedicineType")
            VALUES
                ('migration', 'migration', 'FAMACHA', 'FAMACHA', 'Puntaje de anemia en mucosa ocular (1–5)', '1–5', 'Dewormer'),
                ('migration', 'migration', 'COPROLOGICAL', 'Coprológico', 'Carga parasitaria en heces', 'hpg', 'Dewormer')
        `);

        await queryRunner.query(`
            INSERT INTO "${schema}"."analysis" (
                "created_by", "updated_by", "analysisTypeId", "sheepId",
                "scheduledDate", "completedDate", "status", "famachaScore", "diagnosis", "notes"
            )
            SELECT
                hc."created_by",
                hc."updated_by",
                at.id,
                hc."sheepId",
                hc."checkDate",
                hc."checkDate",
                'Completed',
                hc."famachaScore",
                CASE
                    WHEN hc."famachaScore" <= 2 THEN 'Anemia — desparasitar'
                    WHEN hc."famachaScore" = 3 THEN 'Vigilar'
                    ELSE 'Sin alerta'
                END,
                hc."notes"
            FROM "${schema}"."health_check" hc
            CROSS JOIN "${schema}"."analysis_type" at
            WHERE at."type" = 'FAMACHA'
        `);

        await queryRunner.query(`
            UPDATE "${schema}"."pregnancy_check"
            SET "checkType" = 'ECO'
            WHERE "checkType" IN ('FAMACHA', 'Control Monta')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';
        await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."analysis"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."analysis_type"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "${schema}"."analysis_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "${schema}"."analysis_kind_enum"`);
    }
}
