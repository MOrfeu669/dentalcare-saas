import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMedicalRecordsInventoryFinancialPayments1785026766443 implements MigrationInterface {
    name = 'AddMedicalRecordsInventoryFinancialPayments1785026766443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('cash', 'pix', 'card', 'insurance', 'boleto')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "receivable_id" uuid NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "paid_at" TIMESTAMP WITH TIME ZONE NOT NULL, "installments" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4582ad19c572976cfd17be6e0c" ON "payments" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6edf2e4236d26faf413ccc5f09" ON "payments" ("clinic_id", "receivable_id") `);
        await queryRunner.query(`CREATE TABLE "odontograms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "patient_id" uuid NOT NULL, "teeth" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_f3a9cf611ef0fdcdaf95fd7a7f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f697ebd9fbbc4d6c7918bad24b" ON "odontograms" ("clinic_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_19912edefd4daf0ea1edc83ab8" ON "odontograms" ("clinic_id", "patient_id") `);
        await queryRunner.query(`CREATE TABLE "clinical_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "patient_id" uuid NOT NULL, "dentist_id" uuid NOT NULL, "appointment_id" uuid, "content" text NOT NULL, CONSTRAINT "PK_590ad4cecf429ecc12e8202cbb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_def84e45f0fbe937e63ca30b27" ON "clinical_notes" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ec1383cff9abb0b69d418f9045" ON "clinical_notes" ("clinic_id", "patient_id") `);
        await queryRunner.query(`CREATE TYPE "public"."clinical_files_type_enum" AS ENUM('radiograph', 'document', 'photo', 'other')`);
        await queryRunner.query(`CREATE TABLE "clinical_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "patient_id" uuid NOT NULL, "uploaded_by" uuid NOT NULL, "type" "public"."clinical_files_type_enum" NOT NULL DEFAULT 'other', "original_name" character varying(255) NOT NULL, "storage_path" character varying(500) NOT NULL, "mime_type" character varying(100) NOT NULL, "size_bytes" integer NOT NULL, "description" text, CONSTRAINT "PK_217bc0c13007d44c9d2c551664a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_06db57d9e7d5a3abc7ee9b40d1" ON "clinical_files" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a454cb51b336f8c60cc013651" ON "clinical_files" ("clinic_id", "patient_id") `);
        await queryRunner.query(`CREATE TABLE "anamnesis_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "patient_id" uuid NOT NULL, "answers" jsonb NOT NULL, "last_updated_by" uuid, CONSTRAINT "PK_f3400722a4df06282c289b5e23b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dab9d377437bf6eba44492a1c6" ON "anamnesis_records" ("clinic_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8c9020008c5536d847baede098" ON "anamnesis_records" ("clinic_id", "patient_id") `);
        await queryRunner.query(`CREATE TYPE "public"."stock_movements_type_enum" AS ENUM('in', 'out')`);
        await queryRunner.query(`CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "material_id" uuid NOT NULL, "type" "public"."stock_movements_type_enum" NOT NULL, "quantity" numeric(10,2) NOT NULL, "reason" text NOT NULL, "treatment_plan_item_id" uuid, CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3576ed8a20c78338c705475091" ON "stock_movements" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9f779fa9907aa655b30b07542a" ON "stock_movements" ("clinic_id", "material_id") `);
        await queryRunner.query(`CREATE TABLE "materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(150) NOT NULL, "unit" character varying(20) NOT NULL, "min_stock" numeric(10,2) NOT NULL DEFAULT '0', "current_stock" numeric(10,2) NOT NULL DEFAULT '0', "expiration_date" date, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2fd1a93ecb222a28bef28663fa0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3b4d9654fd904a39e1102be000" ON "materials" ("clinic_id") `);
        await queryRunner.query(`CREATE TYPE "public"."receivables_status_enum" AS ENUM('pending', 'partially_paid', 'paid', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "receivables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "patient_id" uuid NOT NULL, "treatment_plan_item_id" uuid, "description" text NOT NULL, "amount" numeric(10,2) NOT NULL, "paid_amount" numeric(10,2) NOT NULL DEFAULT '0', "due_date" date NOT NULL, "status" "public"."receivables_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_d77a2c19436083a2039cf06f1ec" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ea3ba47e5047954159882f29d8" ON "receivables" ("clinic_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9347372dc9df41935b9755690c" ON "receivables" ("clinic_id", "patient_id") `);
        await queryRunner.query(`CREATE TYPE "public"."payables_status_enum" AS ENUM('pending', 'paid', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "payables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "supplier_id" uuid, "description" text NOT NULL, "amount" numeric(10,2) NOT NULL, "due_date" date NOT NULL, "status" "public"."payables_status_enum" NOT NULL DEFAULT 'pending', "paid_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_33adb2ad800095b1f556f01b2c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_62d8be17576fa19c86031375bc" ON "payables" ("clinic_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_62d8be17576fa19c86031375bc"`);
        await queryRunner.query(`DROP TABLE "payables"`);
        await queryRunner.query(`DROP TYPE "public"."payables_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9347372dc9df41935b9755690c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ea3ba47e5047954159882f29d8"`);
        await queryRunner.query(`DROP TABLE "receivables"`);
        await queryRunner.query(`DROP TYPE "public"."receivables_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b4d9654fd904a39e1102be000"`);
        await queryRunner.query(`DROP TABLE "materials"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f779fa9907aa655b30b07542a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3576ed8a20c78338c705475091"`);
        await queryRunner.query(`DROP TABLE "stock_movements"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movements_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c9020008c5536d847baede098"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dab9d377437bf6eba44492a1c6"`);
        await queryRunner.query(`DROP TABLE "anamnesis_records"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a454cb51b336f8c60cc013651"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06db57d9e7d5a3abc7ee9b40d1"`);
        await queryRunner.query(`DROP TABLE "clinical_files"`);
        await queryRunner.query(`DROP TYPE "public"."clinical_files_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec1383cff9abb0b69d418f9045"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_def84e45f0fbe937e63ca30b27"`);
        await queryRunner.query(`DROP TABLE "clinical_notes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_19912edefd4daf0ea1edc83ab8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f697ebd9fbbc4d6c7918bad24b"`);
        await queryRunner.query(`DROP TABLE "odontograms"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6edf2e4236d26faf413ccc5f09"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4582ad19c572976cfd17be6e0c"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    }

}
