import { NotificationChannel } from '../entities/notification-log.entity';

export interface NotificationSendResult {
  success: boolean;
  error?: string;
}

/**
 * Contrato que qualquer provedor de envio precisa cumprir. Trocar de
 * "log-only" pra WhatsApp Business API / Twilio / SMTP de verdade é
 * só implementar esta interface e trocar o provider no
 * notifications.module.ts — nada mais no módulo muda.
 */
export interface NotificationSender {
  send(
    channel: NotificationChannel,
    recipient: string,
    message: string,
  ): Promise<NotificationSendResult>;
}

export const NOTIFICATION_SENDER = Symbol('NOTIFICATION_SENDER');
