import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidade base para tabelas que pertencem a uma clínica (tenant).
 *
 * Estratégia de multi-tenancy adotada: "shared database, shared schema"
 * com discriminação por coluna `clinic_id` (mais simples de operar em
 * um monólito modular do que schema-per-tenant, e suficiente para o
 * volume esperado de clínicas). Toda query de módulos de negócio DEVE
 * filtrar por clinic_id — isso é reforçado pelo TenantRepository
 * (ver common/base/tenant.repository.ts) e pelo TenantInterceptor,
 * nunca deixado a critério de cada service individualmente.
 */
export abstract class TenantBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date; // soft delete — nada é apagado de verdade (auditoria/histórico clínico)
}
