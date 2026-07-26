import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

/**
 * "Evolução": um registro por atendimento. Propositalmente sem update/
 * delete no service — é um histórico clínico, não deveria ser
 * reescrito depois (auditoria/segurança jurídica do prontuário).
 */
@Entity('clinical_notes')
@Index(['clinicId', 'patientId'])
export class ClinicalNote extends TenantBaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'dentist_id', type: 'uuid' })
  dentistId: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string;

  @Column({ type: 'text' })
  content: string;
}
