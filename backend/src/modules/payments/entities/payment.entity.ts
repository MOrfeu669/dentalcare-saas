import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

export enum PaymentMethod {
  CASH = 'cash',
  PIX = 'pix',
  CARD = 'card',
  INSURANCE = 'insurance', // convênio
  BOLETO = 'boleto',
}

@Entity('payments')
@Index(['clinicId', 'receivableId'])
export class Payment extends TenantBaseEntity {
  @Column({ name: 'receivable_id', type: 'uuid' })
  receivableId: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt: Date;

  @Column({ type: 'int', default: 1 })
  installments: number;
}
