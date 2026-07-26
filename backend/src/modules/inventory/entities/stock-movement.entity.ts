import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
}

@Entity('stock_movements')
@Index(['clinicId', 'materialId'])
export class StockMovement extends TenantBaseEntity {
  @Column({ name: 'material_id', type: 'uuid' })
  materialId: string;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'text' })
  reason: string; // ex.: "Compra NF 1234", "Consumo — procedimento X", "Perda/vencimento"

  // Preenchido quando a saída é consequência automática de um
  // procedimento concluído (ver TODO de auto-consumo no procedures.module.ts)
  @Column({ name: 'treatment_plan_item_id', type: 'uuid', nullable: true })
  treatmentPlanItemId: string;
}
