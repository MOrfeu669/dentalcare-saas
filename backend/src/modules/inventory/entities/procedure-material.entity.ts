import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

/**
 * "Receita" de consumo de um procedimento: quanto de cada material é
 * gasto ao executá-lo. Relação decidida: 1 procedimento → N materiais
 * (várias linhas com o mesmo procedureId, uma por material). Um
 * material também pode aparecer na receita de vários procedimentos
 * diferentes — não há limite do lado do material.
 *
 * Fica no InventoryModule (não em Procedures) de propósito: assim
 * quem valida "o material existe/está ativo" e quem consome o estoque
 * automaticamente ficam no mesmo módulo, sem dependência circular
 * (Inventory → Procedures numa via só, pra validar que o procedimento existe).
 */
@Entity('procedure_materials')
@Index(['clinicId', 'procedureId', 'materialId'], { unique: true })
export class ProcedureMaterial extends TenantBaseEntity {
  @Column({ name: 'procedure_id', type: 'uuid' })
  procedureId: string;

  @Column({ name: 'material_id', type: 'uuid' })
  materialId: string;

  // Quantidade consumida por execução do procedimento (mesma unidade
  // cadastrada em Material.unit — ex.: 2 "un", 0.5 "ml")
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity: number;
}
