import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

/** Sala/cadeira de atendimento. Usada na checagem de conflitos da agenda. */
@Entity('rooms')
export class Room extends TenantBaseEntity {
  @Column({ length: 60 })
  name: string; // ex.: "Consultório 1", "Cadeira 2"

  @Column({ default: true })
  active: boolean;
}
