import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  NotificationLog,
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  NotificationReplyStatus,
} from '../entities/notification-log.entity';
import { NOTIFICATION_SENDER, NotificationSender } from '../senders/notification-sender.interface';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { PatientsService } from '../../patients/services/patients.service';
import { UsersService } from '../../users/services/users.service';
import { UserRole } from '../../../common/interfaces/user-role.enum';

interface AppointmentCreatedPayload {
  clinicId: string;
  appointmentId: string;
}

interface LowStockPayload {
  clinicId: string;
  materialId: string;
  materialName: string;
  currentStock: number;
  minStock: number;
}

const REMINDER_HOURS_BEFORE = 24;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
    @Inject(NOTIFICATION_SENDER)
    private readonly sender: NotificationSender,
    private readonly appointmentsService: AppointmentsService,
    private readonly patientsService: PatientsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Requisito "Confirmação automática": ao criar uma consulta, agenda
   * o lembrete (24h antes, ou imediatamente se a consulta já estiver
   * a menos de 24h de distância). Não envia na hora — só entra na
   * fila; quem envia de fato é o cron (processPendingReminders).
   */
  @OnEvent('appointment.created')
  async handleAppointmentCreated(payload: AppointmentCreatedPayload) {
    const appointment = await this.appointmentsService.findOne(payload.clinicId, payload.appointmentId);
    if (!appointment.patientId) {
      // Não deveria acontecer — 'appointment.created' só é emitido para
      // consultas (que exigem paciente); é uma guarda defensiva porque
      // Appointment.patientId aceita null (Compromissos não têm paciente).
      this.logger.warn(`Consulta ${appointment.id} sem paciente — lembrete não agendado.`);
      return;
    }
    const patient = await this.patientsService.getBasicInfo(payload.clinicId, appointment.patientId);

    const recipient = patient.whatsapp || patient.phone;
    if (!recipient) {
      this.logger.warn(`Paciente ${patient.id} sem telefone cadastrado — lembrete não agendado.`);
      return;
    }

    let scheduledFor = new Date(appointment.startTime);
    scheduledFor.setHours(scheduledFor.getHours() - REMINDER_HOURS_BEFORE);
    if (scheduledFor.getTime() <= Date.now()) {
      scheduledFor = new Date(); // consulta já está a menos de 24h — manda assim que o cron rodar
    }

    const when = new Date(appointment.startTime).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const log = this.notificationLogRepository.create({
      clinicId: payload.clinicId,
      channel: patient.whatsapp ? NotificationChannel.WHATSAPP : NotificationChannel.SMS,
      type: NotificationType.APPOINTMENT_REMINDER,
      recipient,
      relatedAppointmentId: appointment.id,
      message: `Olá, ${patient.name}! Você tem uma consulta em ${when}. Responda CONFIRMAR ou CANCELAR.`,
      status: NotificationStatus.PENDING,
      scheduledFor,
    });
    await this.notificationLogRepository.save(log);
  }

  /**
   * Requisito "notificação em caso de falta de material" — este
   * dispara na hora (não entra na fila do cron), já que estoque baixo
   * é uma situação operacional, não algo que faz sentido esperar.
   */
  @OnEvent('inventory.low-stock')
  async handleLowStock(payload: LowStockPayload) {
    const users = await this.usersService.findAllInClinic(payload.clinicId);
    const admins = users.filter((u) => u.role === UserRole.ADMIN && u.email);

    const message = `Estoque baixo: ${payload.materialName} está em ${payload.currentStock} (mínimo: ${payload.minStock}).`;

    for (const admin of admins) {
      const result = await this.sender.send(NotificationChannel.EMAIL, admin.email, message);

      const log = this.notificationLogRepository.create({
        clinicId: payload.clinicId,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.LOW_STOCK_ALERT,
        recipient: admin.email,
        relatedMaterialId: payload.materialId,
        message,
        status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        scheduledFor: new Date(),
        sentAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
      });
      await this.notificationLogRepository.save(log);
    }
  }

  /**
   * Roda a cada minuto (suficiente pra uma clínica; ajustável). Processa
   * todo lembrete cuja hora de envio já chegou. Exposto também via
   * POST /notifications/process-pending pra rodar sob demanda.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingReminders(): Promise<{ processed: number }> {
    const due = await this.notificationLogRepository.find({
      where: { status: NotificationStatus.PENDING, scheduledFor: LessThanOrEqual(new Date()) },
    });

    for (const notification of due) {
      const result = await this.sender.send(
        notification.channel,
        notification.recipient,
        notification.message,
      );

      await this.notificationLogRepository.update(notification.id, {
        status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        sentAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
      });

      if (result.success && notification.relatedAppointmentId) {
        await this.appointmentsService.markReminderSent(
          notification.clinicId,
          notification.relatedAppointmentId,
        );
      }
    }

    return { processed: due.length };
  }

  /**
   * Registra a resposta do paciente ao lembrete — em produção isso
   * seria chamado por um webhook do provedor de WhatsApp/SMS; aqui é
   * um endpoint autenticado que simula essa resposta chegando.
   */
  async registerReply(
    clinicId: string,
    notificationId: string,
    status: 'confirmed' | 'cancelled',
  ): Promise<NotificationLog> {
    const notification = await this.notificationLogRepository.findOne({
      where: { id: notificationId, clinicId },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    if (notification.type !== NotificationType.APPOINTMENT_REMINDER) {
      throw new BadRequestException('Só é possível registrar resposta em lembretes de consulta.');
    }

    const replyStatus =
      status === 'confirmed' ? NotificationReplyStatus.CONFIRMED : NotificationReplyStatus.CANCELLED;

    await this.notificationLogRepository.update(notificationId, {
      replyStatus,
      repliedAt: new Date(),
    });

    if (notification.relatedAppointmentId) {
      if (status === 'confirmed') {
        await this.appointmentsService.confirm(clinicId, notification.relatedAppointmentId);
      } else {
        await this.appointmentsService.cancel(
          clinicId,
          notification.relatedAppointmentId,
          'Cancelado pelo paciente via resposta ao lembrete automático',
        );
      }
    }

    return this.notificationLogRepository.findOne({
      where: { id: notificationId, clinicId },
    }) as Promise<NotificationLog>;
  }

  findByAppointment(clinicId: string, appointmentId: string): Promise<NotificationLog[]> {
    return this.notificationLogRepository.find({
      where: { clinicId, relatedAppointmentId: appointmentId },
      order: { createdAt: 'DESC' },
    });
  }

  findAll(clinicId: string, status?: NotificationStatus): Promise<NotificationLog[]> {
    return this.notificationLogRepository.find({
      where: { clinicId, ...(status ? { status } : {}) },
      order: { scheduledFor: 'DESC' },
    });
  }
}
