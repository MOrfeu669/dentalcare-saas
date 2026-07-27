import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '../entities/notification-log.entity';
import { NotificationSender, NotificationSendResult } from './notification-sender.interface';

/**
 * Implementação padrão: não fala com nenhuma API externa (não temos
 * credenciais nem acesso de rede pra WhatsApp Business API / provedor
 * de SMS / SMTP neste ambiente). Sempre "sucesso", só registra no log
 * da aplicação — dá pra ver a mensagem que teria sido enviada e testar
 * toda a fila (agendamento, fila, confirmação) sem depender de nada
 * externo.
 *
 * Para produção: implementar WhatsAppNotificationSender (usando
 * WHATSAPP_API_URL/WHATSAPP_API_TOKEN do .env), SmtpNotificationSender
 * (SMTP_*) etc., e trocar o provider registrado em notifications.module.ts.
 */
@Injectable()
export class ConsoleNotificationSender implements NotificationSender {
  private readonly logger = new Logger('NotificationSender');

  async send(
    channel: NotificationChannel,
    recipient: string,
    message: string,
  ): Promise<NotificationSendResult> {
    this.logger.log(`[${channel.toUpperCase()}] para ${recipient}: "${message}"`);
    return { success: true };
  }
}
