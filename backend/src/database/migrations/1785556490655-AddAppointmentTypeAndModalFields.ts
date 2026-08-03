import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppointmentTypeAndModalFields1785556490655 implements MigrationInterface {
    name = 'AddAppointmentTypeAndModalFields1785556490655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_clinic_settings_clinic_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_clinic_created"`);
        await queryRunner.query(`CREATE TYPE "public"."appointments_type_enum" AS ENUM('consultation', 'commitment')`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "type" "public"."appointments_type_enum" NOT NULL DEFAULT 'consultation'`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "title" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "auto_confirmation_enabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "label" character varying(40)`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "label_color" character varying(7)`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "return_of_appointment_id" uuid`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "patient_id" DROP NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6ccc959b11409b903969e673b5" ON "clinic_settings" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_99e207a4390895169886b7b5a3" ON "audit_logs" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8cb260351e4cec173c722e6794" ON "audit_logs" ("clinic_id", "created_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8cb260351e4cec173c722e6794"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99e207a4390895169886b7b5a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ccc959b11409b903969e673b5"`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "patient_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "return_of_appointment_id"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "label_color"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "label"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "auto_confirmation_enabled"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_type_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_clinic_created" ON "audit_logs" ("clinic_id", "created_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_clinic_settings_clinic_id" ON "clinic_settings" ("clinic_id") `);
    }

}
