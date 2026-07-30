import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

@Entity('audit_logs')
@Index(['clinicId', 'createdAt'])
export class AuditLog extends TenantBaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId?: string;

  @Column({ length: 50 })
  action?: string;

  @Column({ name: 'entity_type', length: 100 })
  entityType?: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId?: string;

  @Column({ type: 'jsonb', nullable: true })
  before?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  after?: Record<string, any>;

  @Column({ length: 45, nullable: true })
  ip?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;
}
