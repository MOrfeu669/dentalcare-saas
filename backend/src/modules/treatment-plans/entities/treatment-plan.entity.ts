import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

export enum TreatmentPlanStatus {
  DRAFT = 'draft', // orçamento em elaboração, ainda não apresentado ao paciente
  PROPOSED = 'proposed', // apresentado ao paciente, aguardando aceite
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TreatmentPlanItemStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled', // já tem uma consulta (appointment) vinculada
  COMPLETED = 'completed',
}

interface TreatmentPlanItem {
  procedureId: string;
  toothNumber?: string; // referência ao odontograma (FDI notation), quando aplicável
  description: string;
  estimatedValue: number;
  status: TreatmentPlanItemStatus;
  appointmentId?: string;
}

/**
 * Plano de tratamento: agrega vários procedimentos previstos para um
 * paciente, com orçamento e acompanhamento do que já foi executado.
 * Ao concluir um item (via módulo Appointments/Procedures), o evento
 * `treatment-plan-item.completed` atualiza este registro e dispara a
 * integração com o Financeiro (requisito "Financeiro integrado").
 */
@Entity('treatment_plans')
export class TreatmentPlan extends TenantBaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'dentist_id', type: 'uuid' })
  dentistId: string;

  @Column({ type: 'jsonb' })
  items: TreatmentPlanItem[];

  @Column({ type: 'enum', enum: TreatmentPlanStatus, default: TreatmentPlanStatus.DRAFT })
  status: TreatmentPlanStatus;

  @Column({ name: 'total_estimated_value', type: 'numeric', precision: 10, scale: 2 })
  totalEstimatedValue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
