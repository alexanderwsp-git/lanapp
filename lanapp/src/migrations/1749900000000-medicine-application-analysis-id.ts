import { MigrationInterface, QueryRunner } from 'typeorm';

export class MedicineApplicationAnalysisId1749900000000 implements MigrationInterface {
    name = 'MedicineApplicationAnalysisId1749900000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';

        await queryRunner.query(`
            ALTER TABLE "${schema}"."medicine_application"
            ADD COLUMN "analysisId" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "${schema}"."medicine_application"
            ADD CONSTRAINT "FK_medicine_application_analysis"
            FOREIGN KEY ("analysisId") REFERENCES "${schema}"."analysis"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';

        await queryRunner.query(`
            ALTER TABLE "${schema}"."medicine_application"
            DROP CONSTRAINT "FK_medicine_application_analysis"
        `);
        await queryRunner.query(`
            ALTER TABLE "${schema}"."medicine_application"
            DROP COLUMN "analysisId"
        `);
    }
}
