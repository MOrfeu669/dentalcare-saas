import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThan, Not, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { AppointmentConflictCheckerService } from './appointment-conflict-checker.service';
import { AppointmentStatus } from '../interfaces/appointment-status.enum';
import { AppointmentType } from '../interfaces/appointment-type.enum';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger('AppointmentsService');

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly conflictChecker: AppointmentConflictCheckerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(clinicId: string, dto: CreateAppointmentDto): Promise<Appointment> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const { returnSchedule, ...appointmentFields } = dto;

    await this.conflictChecker.assertNoConflict({
      clinicId,
      dentistId: dto.dentistId,
      roomId: dto.roomId,
      startTime,
      endTime,
    });

    const appointment = this.appointmentRepository.create({
      ...appointmentFields,
      clinicId,
      startTime,
      endTime,
    });
    const saved = await this.appointmentRepository.save(appointment);

    // "Confirmação automática" do modal: só agenda o lembrete quando é
    // uma Consulta de verdade (tem paciente) e o switch está ligado.
    // O módulo de Notifications escuta este evento — sem acoplar
    // Appointments a Notifications.
    const isConsultation = (dto.type ?? AppointmentType.CONSULTATION) === AppointmentType.CONSULTATION;
    if (isConsultation && dto.autoConfirmationEnabled !== false) {
      this.eventEmitter.emit('appointment.created', { appointmentId: saved.id, clinicId });
    }

    if (returnSchedule && isConsultation) {
      await this.scheduleReturnIfRequested(clinicId, saved, returnSchedule);
    }

    return saved;
  }

  /**
   * "Data de retorno" do modal — cria uma segunda consulta automática
   * (mesmo paciente/dentista/sala/duração da original) na data calculada.
   * Falha isolada de propósito: se der conflito de horário no dia do
   * retorno, não derruba a criação da consulta original — só fica
   * registrado como aviso (mesmo padrão usado no consumo automático de
   * estoque).
   */
  private async scheduleReturnIfRequested(
    clinicId: string,
    original: Appointment,
    returnSchedule: NonNullable<CreateAppointmentDto['returnSchedule']>,
  ): Promise<void> {
    const returnDate = returnSchedule.specificDate
      ? new Date(returnSchedule.specificDate)
      : new Date(original.startTime);

    if (returnSchedule.days) {
      returnDate.setDate(returnDate.getDate() + returnSchedule.days);
    }
    if (returnSchedule.specificDate) {
      // Mantém o mesmo horário do dia da consulta original, só troca a data.
      returnDate.setHours(
        original.startTime.getHours(),
        original.startTime.getMinutes(),
        0,
        0,
      );
    }

    const durationMs = original.endTime.getTime() - original.startTime.getTime();
    const returnEnd = new Date(returnDate.getTime() + durationMs);

    try {
      await this.create(clinicId, {
        type: AppointmentType.CONSULTATION,
        patientId: original.patientId!,
        dentistId: original.dentistId,
        roomId: original.roomId ?? undefined,
        startTime: returnDate.toISOString(),
        endTime: returnEnd.toISOString(),
        notes: 'Retorno agendado automaticamente',
        label: 'Retorno',
        labelColor: '#4D8B6F',
        autoConfirmationEnabled: original.autoConfirmationEnabled,
      });
    } catch (error) {
      this.logger.warn(
        `Não foi possível agendar o retorno automático da consulta ${original.id}: ${(error as Error).message}`,
      );
    }
  }

  async reschedule(
    clinicId: string,
    id: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Appointment> {
    const appointment = await this.findOne(clinicId, id);

    await this.conflictChecker.assertNoConflict({
      clinicId,
      dentistId: appointment.dentistId,
      roomId: appointment.roomId,
      startTime,
      endTime,
      excludeAppointmentId: id,
    });

    await this.appointmentRepository.update(id, { startTime, endTime });
    return this.findOne(clinicId, id);
  }

  async cancel(clinicId: string, id: string, reason: string): Promise<Appointment> {
    await this.findOne(clinicId, id);
    await this.appointmentRepository.update(id, {
      status: AppointmentStatus.CANCELLED,
      cancelledReason: reason,
    });
    return this.findOne(clinicId, id);
  }

  async confirm(clinicId: string, id: string): Promise<Appointment> {
    await this.findOne(clinicId, id);
    await this.appointmentRepository.update(id, {
      status: AppointmentStatus.CONFIRMED,
      confirmedAt: new Date(),
    });
    return this.findOne(clinicId, id);
  }

  /** Chamado pelo NotificationsModule ao enviar o lembrete automático. */
  async markReminderSent(clinicId: string, id: string): Promise<void> {
    await this.findOne(clinicId, id);
    await this.appointmentRepository.update(id, { reminderSentAt: new Date() });
  }

  /** Marca a consulta como realizada — recepção/dentista finaliza o atendimento. */
  async complete(clinicId: string, id: string): Promise<Appointment> {
    await this.findOne(clinicId, id);
    await this.appointmentRepository.update(id, { status: AppointmentStatus.COMPLETED });
    return this.findOne(clinicId, id);
  }

  /** "Próxima consulta" do Dashboard — a primeira que ainda vai acontecer. */
  findNext(clinicId: string): Promise<Appointment | null> {
    return this.appointmentRepository.findOne({
      where: {
        clinicId,
        startTime: MoreThan(new Date()),
        status: Not(In([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW])),
      },
      relations: ['room'],
      order: { startTime: 'ASC' },
    });
  }

  /**
   * "Pacientes aguardando" — confirmaram presença e o horário já
   * chegou, mas o atendimento ainda não começou nem foi concluído.
   */
  findWaitingNow(clinicId: string): Promise<Appointment[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.appointmentRepository.find({
      where: {
        clinicId,
        status: AppointmentStatus.CONFIRMED,
        startTime: Between(startOfDay, new Date()),
      },
      order: { startTime: 'ASC' },
    });
  }

  /**
   * "Confirmações pendentes" — lembrete já foi (ou será) enviado, mas o
   * paciente ainda não respondeu. Janela de 48h pra não misturar com
   * consultas muito distantes no futuro.
   */
  findPendingConfirmations(clinicId: string): Promise<Appointment[]> {
    const in48h = new Date();
    in48h.setHours(in48h.getHours() + 48);

    return this.appointmentRepository.find({
      where: {
        clinicId,
        status: AppointmentStatus.SCHEDULED,
        startTime: Between(new Date(), in48h),
      },
      order: { startTime: 'ASC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({ where: { id, clinicId } });
    if (!appointment) throw new NotFoundException('Consulta não encontrada');
    return appointment;
  }

  getDaySchedule(clinicId: string, date: Date) {
    return this.conflictChecker.findDaySchedule(clinicId, date);
  }

  /** Usado pelo relatório de Agenda (contagem por status, por profissional). */
  findInRange(clinicId: string, from: Date, to: Date): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { clinicId, startTime: Between(from, to) },
      order: { startTime: 'ASC' },
    });
  }

  /** "Encontrar horário" do modal — delega pro conflict checker. */
  findAvailableSlots(clinicId: string, dentistId: string, date: Date, durationMinutes: number) {
    return this.conflictChecker.findAvailableSlots(clinicId, dentistId, date, durationMinutes);
  }
}
