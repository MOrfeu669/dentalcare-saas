import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingTenantIndexClinicSettings1785702460449 implements MigrationInterface {
    name = 'AddMissingTenantIndexClinicSettings1785702460449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_6ccc959b11409b903969e673b5" ON "clinic_settings" ("clinic_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6ccc959b11409b903969e673b5"`);
    }

}
