import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';
import { AppointmentStatus } from '../interfaces/appointment-status.enum';
import { Room } from './room.entity';

@Entity('appointments')
@Index(['clinicId', 'dentistId', 'startTime'])
@Index(['clinicId', 'roomId', 'startTime'])
export class Appointment extends TenantBaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'dentist_id', type: 'uuid' })
  dentistId: string; // referencia users.id (funcionário com role = DENTIST)

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId: string;

  @ManyToOne(() => Room, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  // Procedimento previsto (define a duração padrão sugerida) — opcional,
  // pois nem toda consulta é vinculada a um procedimento fechado (ex.: avaliação)
  @Column({ name: 'procedure_id', type: 'uuid', nullable: true })
  procedureId: string;

  @Column({ name: 'treatment_plan_id', type: 'uuid', nullable: true })
  treatmentPlanId: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  // Preenchidos pelo módulo de Notifications (requisito "Confirmação automática")
  @Column({ name: 'reminder_sent_at', type: 'timestamptz', nullable: true })
  reminderSentAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
