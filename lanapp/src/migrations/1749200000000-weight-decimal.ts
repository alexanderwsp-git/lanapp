import { MigrationInterface, QueryRunner } from 'typeorm';

/** weight.weight was integer in init — farm pesajes need decimals (e.g. 12.3 kg). */
export class WeightDecimal1749200000000 implements MigrationInterface {
    name = 'WeightDecimal1749200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "lanapp"."weight" ALTER COLUMN "weight" TYPE numeric(5,2) USING "weight"::numeric(5,2)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "lanapp"."weight" ALTER COLUMN "weight" TYPE integer USING round("weight")::integer`
        );
    }
}
