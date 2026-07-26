import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

interface AnamnesisAnswers {
  allergies?: string;
  currentMedications?: string;
  chronicConditions?: string; // diabetes, hipertensão etc.
  previousSurgeries?: string;
  isPregnant?: boolean;
  bleedingDisorders?: boolean;
  smoker?: boolean;
  additionalNotes?: string;
}

/**
 * Um registro "vivo" por paciente (não um histórico de versões — se
 * quiser auditar mudanças, isso já fica coberto pelo AuditModule).
 * Atualizado via upsert: quem chama update() sem já existir um
 * registro, cria um novo.
 */
@Entity('anamnesis_records')
@Index(['clinicId', 'patientId'], { unique: true })
export class AnamnesisRecord extends TenantBaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ type: 'jsonb' })
  answers: AnamnesisAnswers;

  @Column({ name: 'last_updated_by', type: 'uuid', nullable: true })
  lastUpdatedBy: string; // userId de quem preencheu/atualizou por último
}
