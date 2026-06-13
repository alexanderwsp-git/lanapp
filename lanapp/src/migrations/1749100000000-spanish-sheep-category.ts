import { MigrationInterface, QueryRunner } from 'typeorm';

const SPANISH_CATEGORIES = [
    'CORDERO',
    'CORDERO DESTETADO (MALTÓN)',
    'BORREGO',
    'REPRODUCTOR',
    'FAENADO',
    'CORDERA',
    'CORDERA DESTETADA (MALTONA)',
    'BORREGA',
    'BORREGA PREÑADA',
    'OVEJA PREÑADA',
    'OVEJA LACTANCIA',
    'OVEJA VACÍA',
    'FAENADA',
    'VENTA',
] as const;

const OLD_TO_NEW: Record<string, string> = {
    'Lamb (Male)': 'CORDERO',
    'Weaned Lamb (Male)': 'CORDERO DESTETADO (MALTÓN)',
    Ram: 'BORREGO',
    'Breeding Ram': 'REPRODUCTOR',
    'Male for Sale': 'VENTA',
    'Male for Slaughter': 'FAENADO',
    'Lamb (Female)': 'CORDERA',
    'Weaned Lamb (Female)': 'CORDERA DESTETADA (MALTONA)',
    Ewe: 'BORREGA',
    'Pregnant Ewe': 'OVEJA PREÑADA',
    'Lactating Ewe': 'OVEJA LACTANCIA',
    'Empty Ewe': 'OVEJA VACÍA',
    'Female for Sale': 'VENTA',
    'Female for Slaughter': 'FAENADA',
};

export class SpanishSheepCategory1749100000000 implements MigrationInterface {
    name = 'SpanishSheepCategory1749100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const enumValues = SPANISH_CATEGORIES.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
        await queryRunner.query(
            `CREATE TYPE "lanapp"."sheep_category_enum_new" AS ENUM(${enumValues})`
        );

        const caseClauses = Object.entries(OLD_TO_NEW)
            .map(
                ([oldVal, newVal]) =>
                    `WHEN '${oldVal.replace(/'/g, "''")}' THEN '${newVal.replace(/'/g, "''")}'::"lanapp"."sheep_category_enum_new"`
            )
            .join(' ');

        await queryRunner.query(`
            ALTER TABLE "lanapp"."sheep"
            ALTER COLUMN "category" TYPE "lanapp"."sheep_category_enum_new"
            USING (CASE "category"::text ${caseClauses} END)
        `);

        await queryRunner.query(`DROP TYPE "lanapp"."sheep_category_enum"`);
        await queryRunner.query(
            `ALTER TYPE "lanapp"."sheep_category_enum_new" RENAME TO "sheep_category_enum"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const oldCategories = Object.keys(OLD_TO_NEW);
        const enumValues = oldCategories.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
        await queryRunner.query(
            `CREATE TYPE "lanapp"."sheep_category_enum_old" AS ENUM(${enumValues})`
        );

        const reverseMap: Record<string, string> = {};
        for (const [oldVal, newVal] of Object.entries(OLD_TO_NEW)) {
            if (!reverseMap[newVal]) reverseMap[newVal] = oldVal;
        }

        const caseClauses = Object.entries(reverseMap)
            .map(
                ([newVal, oldVal]) =>
                    `WHEN '${newVal.replace(/'/g, "''")}' THEN '${oldVal.replace(/'/g, "''")}'::"lanapp"."sheep_category_enum_old"`
            )
            .join(' ');

        await queryRunner.query(`
            ALTER TABLE "lanapp"."sheep"
            ALTER COLUMN "category" TYPE "lanapp"."sheep_category_enum_old"
            USING (CASE "category"::text ${caseClauses} ELSE 'Ewe'::"lanapp"."sheep_category_enum_old" END)
        `);

        await queryRunner.query(`DROP TYPE "lanapp"."sheep_category_enum"`);
        await queryRunner.query(
            `ALTER TYPE "lanapp"."sheep_category_enum_old" RENAME TO "sheep_category_enum"`
        );
    }
}
