import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProceduresAndTreatmentPlanItemId1784948799230 implements MigrationInterface {
    name = 'AddProceduresAndTreatmentPlanItemId1784948799230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "procedures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(150) NOT NULL, "description" text, "category" character varying(60), "default_value" numeric(10,2) NOT NULL, "estimated_minutes" integer NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e7775bab78f27b4c47580b6cb4b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_42277adf06e343760139d09999" ON "procedures" ("clinic_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_42277adf06e343760139d09999"`);
        await queryRunner.query(`DROP TABLE "procedures"`);
    }

}
