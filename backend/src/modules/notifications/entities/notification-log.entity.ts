import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

export enum NotificationChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
}

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  LOW_STOCK_ALERT = 'low_stock_alert',
}

export enum NotificationStatus {
  PENDING = 'pending', // na fila, aguardando o horário de envio (scheduledFor)
  SENT = 'sent',
  FAILED = 'failed',
}

export enum NotificationReplyStatus {
  NONE = 'none',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('notification_logs')
@Index(['clinicId', 'status', 'scheduledFor'])
export class NotificationLog extends TenantBaseEntity {
  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ length: 100 })
  recipient: string; // telefone ou e-mail

  @Column({ name: 'related_appointment_id', type: 'uuid', nullable: true })
  relatedAppointmentId: string;

  @Column({ name: 'related_material_id', type: 'uuid', nullable: true })
  relatedMaterialId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ name: 'scheduled_for', type: 'timestamptz' })
  scheduledFor: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  // "Registrar quem confirmou (não respondeu) ou cancelou" — preenchido
  // quando o paciente responde ao lembrete (ver NotificationsController.reply)
  @Column({
    name: 'reply_status',
    type: 'enum',
    enum: NotificationReplyStatus,
    default: NotificationReplyStatus.NONE,
  })
  replyStatus: NotificationReplyStatus;

  @Column({ name: 'replied_at', type: 'timestamptz', nullable: true })
  repliedAt: Date;
}
