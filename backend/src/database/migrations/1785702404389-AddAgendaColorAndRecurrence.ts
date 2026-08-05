import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgendaColorAndRecurrence1785702404389 implements MigrationInterface {
    name = 'AddAgendaColorAndRecurrence1785702404389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6ccc959b11409b903969e673b5"`);
        await queryRunner.query(`ALTER TABLE "dentist_profiles" ADD "agenda_color" character varying(7) NOT NULL DEFAULT '#0F5E5A'`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "recurrence_group_id" uuid`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_clinic_settings_clinic_id" ON "clinic_settings" ("clinic_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_clinic_settings_clinic_id"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "recurrence_group_id"`);
        await queryRunner.query(`ALTER TABLE "dentist_profiles" DROP COLUMN "agenda_color"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6ccc959b11409b903969e673b5" ON "clinic_settings" ("clinic_id") `);
    }

}
