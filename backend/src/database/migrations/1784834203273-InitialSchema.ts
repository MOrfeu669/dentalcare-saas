import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784834203273 implements MigrationInterface {
    name = 'InitialSchema1784834203273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Necessária para uuid_generate_v4() usado como default das PKs.
        // No Supabase já vem habilitada por padrão; em um Postgres "cru"
        // (ex.: ambiente de teste local), precisa ser criada explicitamente.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "clinics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "cnpj" character varying(18) NOT NULL, "phone" character varying(30), "email" character varying(150), "business_hours" jsonb, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4ab0ea5c03a4994cee1897615ed" UNIQUE ("cnpj"), CONSTRAINT "PK_5513b659e4d12b01a8ab3956abc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'dentist', 'receptionist')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(150) NOT NULL, "email" character varying(150) NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'receptionist', "professional_license" character varying(30), "active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e01b3eb43a6c8ae7d74d1ceeb2" ON "users" ("clinic_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."treatment_plans_status_enum" AS ENUM('draft', 'proposed', 'accepted', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "treatment_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "patient_id" uuid NOT NULL, "dentist_id" uuid NOT NULL, "items" jsonb NOT NULL, "status" "public"."treatment_plans_status_enum" NOT NULL DEFAULT 'draft', "total_estimated_value" numeric(10,2) NOT NULL, "notes" text, CONSTRAINT "PK_6372779b339933b56aa985167f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d929f3c2ad1ad3809d13079fa3" ON "treatment_plans" ("clinic_id") `);
        await queryRunner.query(`CREATE TABLE "patients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(150) NOT NULL, "cpf" character varying(14) NOT NULL, "birth_date" date NOT NULL, "phone" character varying(30) NOT NULL, "whatsapp" character varying(30), "email" character varying(150), "address" jsonb, "insurance_provider" character varying(100), "insurance_plan_number" character varying(50), "emergency_contact" jsonb, "observations" text, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e04719758e19c1b94f3768aa7c" ON "patients" ("clinic_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_abc4a9939768807077371dc480" ON "patients" ("clinic_id", "cpf") `);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(60) NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6788ab1ec185d5ca33504ea345" ON "rooms" ("clinic_id") `);
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "patient_id" uuid NOT NULL, "dentist_id" uuid NOT NULL, "room_id" uuid, "procedure_id" uuid, "treatment_plan_id" uuid, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "end_time" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'scheduled', "reminder_sent_at" TIMESTAMP WITH TIME ZONE, "confirmed_at" TIMESTAMP WITH TIME ZONE, "cancelled_reason" text, "notes" text, CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5de9b36b534afa4cdfc183b9e4" ON "appointments" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_434763e4c916fc52c6d2dfdc0e" ON "appointments" ("clinic_id", "room_id", "start_time") `);
        await queryRunner.query(`CREATE INDEX "IDX_f9e7ac9fa2bbe81a9073133e55" ON "appointments" ("clinic_id", "dentist_id", "start_time") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_e01b3eb43a6c8ae7d74d1ceeb2c" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_3cf8c30e138f692e575c5dc420e" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_3cf8c30e138f692e575c5dc420e"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_e01b3eb43a6c8ae7d74d1ceeb2c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f9e7ac9fa2bbe81a9073133e55"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_434763e4c916fc52c6d2dfdc0e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5de9b36b534afa4cdfc183b9e4"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6788ab1ec185d5ca33504ea345"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_abc4a9939768807077371dc480"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e04719758e19c1b94f3768aa7c"`);
        await queryRunner.query(`DROP TABLE "patients"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d929f3c2ad1ad3809d13079fa3"`);
        await queryRunner.query(`DROP TABLE "treatment_plans"`);
        await queryRunner.query(`DROP TYPE "public"."treatment_plans_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e01b3eb43a6c8ae7d74d1ceeb2"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "clinics"`);
    }

}
