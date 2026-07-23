import { Module } from '@nestjs/common';

/**
 * Lembretes de consulta (WhatsApp/SMS/e-mail), confirmação automática
 * e alertas de estoque/financeiro. Reage a eventos emitidos por outros
 * módulos (appointment.created, low-stock.detected) via @OnEvent —
 * assim nenhum módulo de negócio precisa saber como notificar.
 */
@Module({})
export class NotificationsModule {}

// TODO: entities/notification-log.entity.ts (channel, recipient, status SENT|DELIVERED|FAILED, appointmentId?)
// TODO: @OnEvent('appointment.created') -> agenda envio do lembrete (ex.: 24h antes) via @nestjs/schedule
// TODO: integrações: WhatsApp Business API, provedor de SMS, SMTP (ver .env.example)
// TODO: registrar quem confirmou / não respondeu / cancelou (usado por Appointments.confirm)
