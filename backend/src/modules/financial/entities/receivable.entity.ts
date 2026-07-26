import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

export enum ReceivableStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('receivables')
@Index(['clinicId', 'patientId'])
export class Receivable extends TenantBaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  // Preenchido quando a conta nasceu automaticamente de um item de
  // plano de tratamento concluído — ver TreatmentPlanEventsListener.
  @Column({ name: 'treatment_plan_item_id', type: 'uuid', nullable: true })
  treatmentPlanItemId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ type: 'enum', enum: ReceivableStatus, default: ReceivableStatus.PENDING })
  status: ReceivableStatus;
}
