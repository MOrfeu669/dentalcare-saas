import { Column, Entity, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

@Entity('clinic_settings')
@Index(['clinicId'], { unique: true })
export class ClinicSettings extends TenantBaseEntity {
  @Column({ default: 'default' })
  theme: string;

  @Column({ name: 'date_format', default: 'dd/mm/yyyy' })
  dateFormat: string;

  @Column({ name: 'time_zone', default: 'America/Sao_Paulo' })
  timeZone: string;

  @Column({ type: 'jsonb', default: {} })
  notificationPreferences: {
    appointmentReminders: boolean;
    lowStockAlerts: boolean;
    paymentAlerts: boolean;
  };
}
