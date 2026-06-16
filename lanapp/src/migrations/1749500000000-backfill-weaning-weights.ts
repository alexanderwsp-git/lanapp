import { MigrationInterface, QueryRunner } from 'typeorm';

/** Mirror weaning_record weights into weight table (Pesos tab) for records missed by sync skip. */
export class BackfillWeaningWeights1749500000000 implements MigrationInterface {
    name = 'BackfillWeaningWeights1749500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'public';

        await queryRunner.query(`
            INSERT INTO "${schema}"."weight" (
                "created_at", "updated_at", "created_by", "updated_by",
                "sheepId", "weight", "measurementDate", "dailyGain", "notes"
            )
            SELECT
                NOW(), NOW(), wr."created_by", wr."updated_by",
                wr."sheepId",
                wr."weaningWeight",
                wr."weaningDate"::timestamp,
                wr."dailyGain",
                TRIM(
                    'Peso de destete' ||
                    CASE
                        WHEN wr."lotId" IS NOT NULL AND TRIM(wr."lotId") <> ''
                        THEN ' · lote ' || TRIM(wr."lotId")
                        ELSE ''
                    END ||
                    CASE
                        WHEN wr."notes" IS NOT NULL AND TRIM(wr."notes") <> ''
                        THEN ' · ' || TRIM(wr."notes")
                        ELSE ''
                    END
                )
            FROM "${schema}"."weaning_record" wr
            WHERE NOT EXISTS (
                SELECT 1 FROM "${schema}"."weight" w
                WHERE w."sheepId" = wr."sheepId"
                  AND w."measurementDate"::date = wr."weaningDate"
            )
        `);

        await queryRunner.query(`
            UPDATE "${schema}"."weight" w
            SET
                "weight" = wr."weaningWeight",
                "dailyGain" = wr."dailyGain",
                "notes" = TRIM(
                    'Peso de destete' ||
                    CASE
                        WHEN wr."lotId" IS NOT NULL AND TRIM(wr."lotId") <> ''
                        THEN ' · lote ' || TRIM(wr."lotId")
                        ELSE ''
                    END ||
                    CASE
                        WHEN wr."notes" IS NOT NULL AND TRIM(wr."notes") <> ''
                        THEN ' · ' || TRIM(wr."notes")
                        ELSE ''
                    END
                ),
                "updated_at" = NOW(),
                "updated_by" = wr."updated_by"
            FROM "${schema}"."weaning_record" wr
            WHERE w."sheepId" = wr."sheepId"
              AND w."measurementDate"::date = wr."weaningDate"
              AND COALESCE(w."notes", '') NOT LIKE '%destete%'
        `);

        await queryRunner.query(`
            UPDATE "${schema}"."sheep" s
            SET
                "weight" = latest."weight",
                "updated_at" = NOW(),
                "updated_by" = latest."updated_by"
            FROM (
                SELECT DISTINCT ON (w."sheepId")
                    w."sheepId", w."weight", w."updated_by"
                FROM "${schema}"."weight" w
                WHERE w."sheepId" IN (SELECT "sheepId" FROM "${schema}"."weaning_record")
                ORDER BY w."sheepId", w."measurementDate" DESC
            ) latest
            WHERE s."id" = latest."sheepId"
              AND s."weight" IS DISTINCT FROM latest."weight"
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Data backfill — no safe automatic rollback.
    }
}
