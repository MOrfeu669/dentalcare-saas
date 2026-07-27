import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { AppointmentConflictCheckerService } from './appointment-conflict-checker.service';
import { AppointmentStatus } from '../interfaces/appointment-status.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly conflictChecker: AppointmentConflictCheckerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(clinicId: string, dto: CreateAppointmentDto): Promise<Appointment> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    await this.conflictChecker.assertNoConflict({
      clinicId,
      dentistId: dto.dentistId,
      roomId: dto.roomId,
      startTime,
      endTime,
    });

    const appointment = this.appointmentRepository.create({
      ...dto,
      clinicId,
      startTime,
      endTime,
    });
    const saved = await this.appointmentRepository.save(appointment);

    // O módulo de Notifications escuta este evento para agendar o lembrete
    // automático (WhatsApp/SMS/e-mail) — sem acoplar Appointments a Notifications.
    this.eventEmitter.emit('appointment.created', { appointmentId: saved.id, clinicId });

    return saved;
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

  async findOne(clinicId: string, id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({ where: { id, clinicId } });
    if (!appointment) throw new NotFoundException('Consulta não encontrada');
    return appointment;
  }

  getDaySchedule(clinicId: string, date: Date) {
    return this.conflictChecker.findDaySchedule(clinicId, date);
  }
}
