import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1743362216137 implements MigrationInterface {
    name = 'Init1743362216137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "lanapp"."location" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_by" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying NOT NULL, "imageUrl" character varying, "latitude" numeric(10,8), "longitude" numeric(11,8), "description" character varying, CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lanapp"."pregnancy_check" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_by" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "matingId" uuid NOT NULL, "checkDate" date NOT NULL, "isPregnant" boolean NOT NULL, "notes" character varying, "nextCheckDate" date, "imageUrl" character varying, CONSTRAINT "PK_aef1d5817ddc1297f1fb7f467a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "lanapp"."mating_status_enum" AS ENUM('Pending', 'Effective', 'Ineffective')`);
        await queryRunner.query(`CREATE TABLE "lanapp"."mating" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_by" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "maleId" uuid NOT NULL, "femaleId" uuid NOT NULL, "matingDate" date NOT NULL, "expectedBirthDate" date, "status" "lanapp"."mating_status_enum" NOT NULL DEFAULT 'Pending', CONSTRAINT "PK_d24995c6ea4b8e63a589ae6e19f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "lanapp"."medicine_type_enum" AS ENUM('Vaccine', 'Antibiotic', 'Vitamin', 'Dewormer', 'Other')`);
        await queryRunner.query(`CREATE TABLE "lanapp"."medicine" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_by" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "lanapp"."medicine_type_enum" NOT NULL, "name" character varying NOT NULL, "dosage" character varying NOT NULL, "description" character varying, "notes" character varying, "imageUrl" character varying, "manufacturer" character varying, "batchNumber" character varying, "expiryDate" date, "price" numeric(10,2), CONSTRAINT "PK_b9e0e6f37b7cadb5f402390928b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "lanapp"."medicine_application_status_enum" AS ENUM('Scheduled', 'Applied', 'Cancelled', 'Missed')`);
        await queryRunner.query(`CREATE TABLE "lanapp"."medicine_application" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_by" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medicineId" uuid NOT NULL, "sheepId" uuid NOT NULL, "applicationDate" TIMESTAMP NOT NULL, "nextApplicationDate" TIMESTAMP, "status" "lanapp"."medicine_application_status_enum" NOT NULL, "notes" character varying, CONSTRAINT "PK_5e9299f43f3016dd8bc74228104" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "lanapp"."sheep_breed_enum" AS ENUM('Suffolk', 'Hampshire', 'Dorset', 'Katahdin', 'Dorper', 'Pelibuey', 'Santa Inés', 'Morada Nova', 'Blackbelly', 'Rambouillet', 'Merino', 'Corriedale', 'Texel', 'Criolla')`);
        await queryRunner.query(`CREATE TYPE "lanapp"."sheep_gender_enum" AS ENUM('Male', 'Female')`);
        await queryRunner.query(`CREATE TYPE "lanapp"."sheep_birthtype_enum" AS ENUM('Single', 'Twin')`);
        await queryRunner.query(`CREATE TYPE "lanapp"."sheep_status_enum" AS ENUM('Active', 'Inactive', 'Sold', 'Deceased', 'Quarantine')`);
        await queryRunner.query(`CREATE TYPE "lanapp"."sheep_category_enum" AS ENUM('Lamb (Male)', 'Weaned Lamb (Male)', 'Ram', 'Breeding Ram', 'Male for Sale', 'Male for Slaughter', 'Lamb (Female)', 'Weaned Lamb (Female)', 'Ewe', 'Pregnant Ewe', 'Lactating Ewe', 'Empty Ewe', 'Female for Sale', 'Female for Slaughter')`);
        await queryRunner.query(`CREATE TYPE "lanapp"."sheep_recordtype_enum" AS ENUM('Born on Farm', 'Purchased', 'Donated', 'Transferred')`);
        await queryRunner.query(`CREATE TABLE "lanapp"."sheep" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_by" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tag" character varying NOT NULL, "name" character varying, "breed" "lanapp"."sheep_breed_enum" NOT NULL, "gender" "lanapp"."sheep_gender_enum" NOT NULL, "birthDate" TIMESTAMP NOT NULL, "birthType" "lanapp"."sheep_birthtype_enum" NOT NULL, "weight" numeric(5,2) NOT NULL, "status" "lanapp"."sheep_status_enum" NOT NULL, "category" "lanapp"."sheep_category_enum" NOT NULL, "recordType" "lanapp"."sheep_recordtype_enum" NOT NULL, "quarantineEndDate" date, "matingCount" integer NOT NULL DEFAULT '0', "effectivenessCount" integer NOT NULL DEFAULT '0', "lastMountedDate" TIMESTAMP, "isPregnant" boolean NOT NULL DEFAULT false, "pregnancyConfirmedAt" date, "deliveryDate" date, "motherId" uuid, "fatherId" uuid, "imageUrl" character varying, "notes" character varying, "birthLocationId" uuid, "currentLocationId" uuid, CONSTRAINT "PK_780534d62445f156b2773817480" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lanapp"."weight" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying NOT NULL, "updated_by" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sheepId" uuid NOT NULL, "weight" integer NOT NULL, "measurementDate" TIMESTAMP NOT NULL, "notes" character varying, CONSTRAINT "PK_d62a2bdd27e5c173f24c4c73a41" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lanapp"."pregnancy_check" ADD CONSTRAINT "FK_4076f9480e49872424f96a46c4a" FOREIGN KEY ("matingId") REFERENCES "lanapp"."mating"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."mating" ADD CONSTRAINT "FK_2ab3da2388c3baebf7ea5e19d7d" FOREIGN KEY ("maleId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."mating" ADD CONSTRAINT "FK_b3bd4165079f060690f5d8e039e" FOREIGN KEY ("femaleId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."medicine_application" ADD CONSTRAINT "FK_d2018c48547a20b8a56c04ff23f" FOREIGN KEY ("medicineId") REFERENCES "lanapp"."medicine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."medicine_application" ADD CONSTRAINT "FK_dabcd7c7fd450d27314545a3f1f" FOREIGN KEY ("sheepId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."sheep" ADD CONSTRAINT "FK_58343d8bb8a044ec7249c8d6e0c" FOREIGN KEY ("motherId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."sheep" ADD CONSTRAINT "FK_f43dba87ce3dba1f1e4f9a9d32a" FOREIGN KEY ("fatherId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."sheep" ADD CONSTRAINT "FK_887613219e07903ff004ed4c73c" FOREIGN KEY ("birthLocationId") REFERENCES "lanapp"."location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."sheep" ADD CONSTRAINT "FK_b1d7842f961395fe68b12e4e61e" FOREIGN KEY ("currentLocationId") REFERENCES "lanapp"."location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lanapp"."weight" ADD CONSTRAINT "FK_0f81170181b59ceaae0b0432531" FOREIGN KEY ("sheepId") REFERENCES "lanapp"."sheep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lanapp"."weight" DROP CONSTRAINT "FK_0f81170181b59ceaae0b0432531"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."sheep" DROP CONSTRAINT "FK_b1d7842f961395fe68b12e4e61e"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."sheep" DROP CONSTRAINT "FK_887613219e07903ff004ed4c73c"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."sheep" DROP CONSTRAINT "FK_f43dba87ce3dba1f1e4f9a9d32a"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."sheep" DROP CONSTRAINT "FK_58343d8bb8a044ec7249c8d6e0c"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."medicine_application" DROP CONSTRAINT "FK_dabcd7c7fd450d27314545a3f1f"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."medicine_application" DROP CONSTRAINT "FK_d2018c48547a20b8a56c04ff23f"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."mating" DROP CONSTRAINT "FK_b3bd4165079f060690f5d8e039e"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."mating" DROP CONSTRAINT "FK_2ab3da2388c3baebf7ea5e19d7d"`);
        await queryRunner.query(`ALTER TABLE "lanapp"."pregnancy_check" DROP CONSTRAINT "FK_4076f9480e49872424f96a46c4a"`);
        await queryRunner.query(`DROP TABLE "lanapp"."weight"`);
        await queryRunner.query(`DROP TABLE "lanapp"."sheep"`);
        await queryRunner.query(`DROP TYPE "lanapp"."sheep_recordtype_enum"`);
        await queryRunner.query(`DROP TYPE "lanapp"."sheep_category_enum"`);
        await queryRunner.query(`DROP TYPE "lanapp"."sheep_status_enum"`);
        await queryRunner.query(`DROP TYPE "lanapp"."sheep_birthtype_enum"`);
        await queryRunner.query(`DROP TYPE "lanapp"."sheep_gender_enum"`);
        await queryRunner.query(`DROP TYPE "lanapp"."sheep_breed_enum"`);
        await queryRunner.query(`DROP TABLE "lanapp"."medicine_application"`);
        await queryRunner.query(`DROP TYPE "lanapp"."medicine_application_status_enum"`);
        await queryRunner.query(`DROP TABLE "lanapp"."medicine"`);
        await queryRunner.query(`DROP TYPE "lanapp"."medicine_type_enum"`);
        await queryRunner.query(`DROP TABLE "lanapp"."mating"`);
        await queryRunner.query(`DROP TYPE "lanapp"."mating_status_enum"`);
        await queryRunner.query(`DROP TABLE "lanapp"."pregnancy_check"`);
        await queryRunner.query(`DROP TABLE "lanapp"."location"`);
    }

}
