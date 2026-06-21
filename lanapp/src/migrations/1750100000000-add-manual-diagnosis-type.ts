import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManualDiagnosisType1750100000000 implements MigrationInterface {
    name = 'AddManualDiagnosisType1750100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';
        await queryRunner.query(
            `ALTER TYPE "${schema}"."diagnosis_type_enum" ADD VALUE IF NOT EXISTS 'Manual'`
        );
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing enum values safely.
    }
}
