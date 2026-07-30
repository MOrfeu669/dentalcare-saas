import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsAndAudit1785030000000 implements MigrationInterface {
  name = 'AddSettingsAndAudit1785030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "clinic_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "theme" character varying NOT NULL DEFAULT 'default',
        "date_format" character varying NOT NULL DEFAULT 'dd/mm/yyyy',
        "time_zone" character varying NOT NULL DEFAULT 'America/Sao_Paulo',
        "notification_preferences" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_clinic_settings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_clinic_settings_clinic_id" ON "clinic_settings" ("clinic_id")`);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "user_id" uuid NOT NULL,
        "action" character varying(50) NOT NULL,
        "entity_type" character varying(100) NOT NULL,
        "entity_id" uuid,
        "before" jsonb,
        "after" jsonb,
        "ip" character varying(45),
        "details" text,
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_clinic_created" ON "audit_logs" ("clinic_id", "created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_clinic_created"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_clinic_settings_clinic_id"`);
    await queryRunner.query(`DROP TABLE "clinic_settings"`);
  }
}
