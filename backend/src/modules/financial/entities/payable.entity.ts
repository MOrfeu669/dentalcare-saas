import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

export enum PayableStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('payables')
export class Payable extends TenantBaseEntity {
  // Nullable de propósito — SuppliersModule ainda é stub. Quando existir,
  // isso vira um uuid apontando pra suppliers.id (sem FK forçada aqui
  // pra não acoplar os módulos além do necessário).
  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ type: 'enum', enum: PayableStatus, default: PayableStatus.PENDING })
  status: PayableStatus;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date;
}
