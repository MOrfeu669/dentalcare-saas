import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDentistProfiles1784927944394 implements MigrationInterface {
    name = 'AddDentistProfiles1784927944394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dentist_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "specialties" jsonb NOT NULL DEFAULT '[]', "working_hours" jsonb, "commission_rate" numeric(5,2), "bio" text, CONSTRAINT "REL_a1212bcbe2b2bbf4128f07ca68" UNIQUE ("user_id"), CONSTRAINT "PK_67ac15491a7e6a92cbefee4191a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2be86d66552d1c0d5d5421d02b" ON "dentist_profiles" ("clinic_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f7fc55523d24452f69aa56d854" ON "dentist_profiles" ("clinic_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "dentist_profiles" ADD CONSTRAINT "FK_a1212bcbe2b2bbf4128f07ca683" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dentist_profiles" DROP CONSTRAINT "FK_a1212bcbe2b2bbf4128f07ca683"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7fc55523d24452f69aa56d854"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2be86d66552d1c0d5d5421d02b"`);
        await queryRunner.query(`DROP TABLE "dentist_profiles"`);
    }

}
