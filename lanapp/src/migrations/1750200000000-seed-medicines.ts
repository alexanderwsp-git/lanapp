import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMedicines1750200000000 implements MigrationInterface {
    name = 'SeedMedicines1750200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';

        await queryRunner.query(`
            INSERT INTO "${schema}"."medicine" (
                "created_by", "updated_by", "type", "name", "dosage", "description"
            )
            SELECT 'seed', 'seed', 'Dewormer', 'Ivermectina', '1ml/50kg', 'Antiparasitario de amplio espectro.'
            WHERE NOT EXISTS (
                SELECT 1 FROM "${schema}"."medicine" WHERE "name" = 'Ivermectina'
            )
        `);

        await queryRunner.query(`
            INSERT INTO "${schema}"."medicine" (
                "created_by", "updated_by", "type", "name", "dosage", "description"
            )
            SELECT 'seed', 'seed', 'Dewormer', 'Albendazol', '1 comprimido/40kg', 'Desparasitante oral.'
            WHERE NOT EXISTS (
                SELECT 1 FROM "${schema}"."medicine" WHERE "name" = 'Albendazol'
            )
        `);

        await queryRunner.query(`
            INSERT INTO "${schema}"."medicine" (
                "created_by", "updated_by", "type", "name", "dosage", "description"
            )
            SELECT 'seed', 'seed', 'Vitamin', 'Complejo B', '5ml', 'Suplemento vitamínico.'
            WHERE NOT EXISTS (
                SELECT 1 FROM "${schema}"."medicine" WHERE "name" = 'Complejo B'
            )
        `);

        await queryRunner.query(`
            INSERT INTO "${schema}"."medicine" (
                "created_by", "updated_by", "type", "name", "dosage", "description"
            )
            SELECT 'seed', 'seed', 'Vaccine', 'Clostridial', '2ml', 'Vacuna contra enfermedades clostridiales.'
            WHERE NOT EXISTS (
                SELECT 1 FROM "${schema}"."medicine" WHERE "name" = 'Clostridial'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DATABASE_SCHEMA || 'lanapp';

        await queryRunner.query(`
            DELETE FROM "${schema}"."medicine"
            WHERE "created_by" = 'seed'
              AND "name" IN ('Ivermectina', 'Albendazol', 'Complejo B', 'Clostridial')
        `);
    }
}
