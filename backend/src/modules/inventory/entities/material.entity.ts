import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

@Entity('materials')
export class Material extends TenantBaseEntity {
  @Column({ length: 150 })
  name: string;

  @Column({ length: 20 })
  unit: string; // "un", "caixa", "ml", "g" — texto livre de propósito, cada clínica usa o seu

  @Column({ name: 'min_stock', type: 'numeric', precision: 10, scale: 2, default: 0 })
  minStock: number;

  @Column({ name: 'current_stock', type: 'numeric', precision: 10, scale: 2, default: 0 })
  currentStock: number;

  // Simplificado: uma validade por material. Numa clínica com lotes
  // diferentes chegando toda semana isso não é suficiente — o correto
  // seria uma entidade MaterialBatch (material_id, lote, validade,
  // quantidade). Deixado assim de propósito pra V1; documentado aqui
  // pra não ser confundido com descuido.
  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: string;

  @Column({ default: true })
  active: boolean;
}
