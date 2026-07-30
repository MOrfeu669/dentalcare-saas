import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProcedureMaterials1785348943446 implements MigrationInterface {
    name = 'AddProcedureMaterials1785348943446'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "procedure_materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "procedure_id" uuid NOT NULL, "material_id" uuid NOT NULL, "quantity" numeric(10,2) NOT NULL, CONSTRAINT "PK_49ed01d2a45986a3f6daa1316a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6955f71c22edacf152c192825f" ON "procedure_materials" ("clinic_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_00a7d5c97b4b5cd59c084f9442" ON "procedure_materials" ("clinic_id", "procedure_id", "material_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_00a7d5c97b4b5cd59c084f9442"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6955f71c22edacf152c192825f"`);
        await queryRunner.query(`DROP TABLE "procedure_materials"`);
    }

}
