import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../interfaces/appointment-status.enum';

/**
 * Responsável exclusivamente por garantir que a agenda nunca tenha:
 *  1) o mesmo dentista em dois atendimentos que se sobrepõem;
 *  2) a mesma sala ocupada por dois atendimentos que se sobrepõem.
 *
 * Isolar essa regra em um serviço próprio (em vez de deixar dentro do
 * AppointmentsService) facilita reuso — o front-end de "salas disponíveis"
 * também pode chamar `findAvailableSlots` para sugerir horários livres.
 */
@Injectable()
export class AppointmentConflictCheckerService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Duas faixas [startA, endA) e [startB, endB) se sobrepõem quando
   * startA < endB E endA > startB. Consultas canceladas não contam como
   * conflito.
   */
  async assertNoConflict(params: {
    clinicId: string;
    dentistId: string;
    roomId?: string;
    startTime: Date;
    endTime: Date;
    excludeAppointmentId?: string; // usado ao reagendar uma consulta existente
  }): Promise<void> {
    const { clinicId, dentistId, roomId, startTime, endTime, excludeAppointmentId } = params;

    const overlappingBase = {
      clinicId,
      status: Not(AppointmentStatus.CANCELLED),
      startTime: LessThan(endTime),
      endTime: MoreThan(startTime),
      ...(excludeAppointmentId ? { id: Not(excludeAppointmentId) } : {}),
    };

    const dentistConflict = await this.appointmentRepository.findOne({
      where: { ...overlappingBase, dentistId },
    });
    if (dentistConflict) {
      throw new ConflictException(
        'Este profissional já possui uma consulta neste horário.',
      );
    }

    if (roomId) {
      const roomConflict = await this.appointmentRepository.findOne({
        where: { ...overlappingBase, roomId },
      });
      if (roomConflict) {
        throw new ConflictException('Esta sala já está ocupada neste horário.');
      }
    }
  }

  /**
   * Lista os compromissos do dia por dentista/sala — a base da visualização
   * "todos os profissionais + salas disponíveis" pedida na Agenda inteligente.
   */
  async findDaySchedule(clinicId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.appointmentRepository.find({
      where: {
        clinicId,
        status: Not(AppointmentStatus.CANCELLED),
        startTime: MoreThan(startOfDay),
        endTime: LessThan(endOfDay),
      },
      relations: ['room'],
      order: { startTime: 'ASC' },
    });
  }
}
