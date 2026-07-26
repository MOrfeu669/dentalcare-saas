import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

@Entity('procedures')
export class Procedure extends TenantBaseEntity {
  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 60, nullable: true })
  category: string; // ex.: "Ortodontia", "Restauração", "Cirurgia"

  @Column({ name: 'default_value', type: 'numeric', precision: 10, scale: 2 })
  defaultValue: number;

  @Column({ name: 'estimated_minutes', type: 'int' })
  estimatedMinutes: number;

  @Column({ default: true })
  active: boolean;
}

// TODO: entities/procedure-material.entity.ts (procedureId, materialId, quantityUsed)
// -> depende do InventoryModule (ainda stub) ter a entidade Material criada primeiro.
// Quando existir: ao concluir um item de TreatmentPlan que referencia este procedimento,
// InventoryModule escuta 'treatment-plan-item.completed' e dá baixa automática
// nesses materiais (requisito "consumo automático por procedimento").
