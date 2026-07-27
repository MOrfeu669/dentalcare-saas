import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1785029979639 implements MigrationInterface {
    name = 'AddNotifications1785029979639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_channel_enum" AS ENUM('whatsapp', 'sms', 'email')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_type_enum" AS ENUM('appointment_reminder', 'low_stock_alert')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_status_enum" AS ENUM('pending', 'sent', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_reply_status_enum" AS ENUM('none', 'confirmed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "channel" "public"."notification_logs_channel_enum" NOT NULL, "type" "public"."notification_logs_type_enum" NOT NULL, "recipient" character varying(100) NOT NULL, "related_appointment_id" uuid, "related_material_id" uuid, "message" text NOT NULL, "status" "public"."notification_logs_status_enum" NOT NULL DEFAULT 'pending', "scheduled_for" TIMESTAMP WITH TIME ZONE NOT NULL, "sent_at" TIMESTAMP WITH TIME ZONE, "error_message" text, "reply_status" "public"."notification_logs_reply_status_enum" NOT NULL DEFAULT 'none', "replied_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_19c524e644cdeaebfcffc284871" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ffe0460e7e62745b10f4b70d29" ON "notification_logs" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_15cfbe9739b6f2e6666564c1ef" ON "notification_logs" ("clinic_id", "status", "scheduled_for") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_15cfbe9739b6f2e6666564c1ef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ffe0460e7e62745b10f4b70d29"`);
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_reply_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_channel_enum"`);
    }

}
