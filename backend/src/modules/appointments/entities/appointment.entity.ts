import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';
import { AppointmentStatus } from '../interfaces/appointment-status.enum';
import { AppointmentType } from '../interfaces/appointment-type.enum';
import { Room } from './room.entity';

@Entity('appointments')
@Index(['clinicId', 'dentistId', 'startTime'])
@Index(['clinicId', 'roomId', 'startTime'])
export class Appointment extends TenantBaseEntity {
  @Column({ type: 'enum', enum: AppointmentType, default: AppointmentType.CONSULTATION })
  type: AppointmentType;

  // Obrigatório quando type = CONSULTATION; nulo em COMMITMENT (aba
  // "Compromisso" do modal não tem paciente — reunião, bloqueio de horário etc.)
  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

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

  // Usado só em COMMITMENT — título livre ("Reunião de equipe",
  // "Bloqueio — almoço"), já que não há paciente pra identificar o evento.
  @Column({ length: 150, nullable: true })
  title: string;

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

  // Switch do modal — quando false, AppointmentsService.create() não
  // emite 'appointment.created', então Notifications nunca agenda o lembrete.
  @Column({ name: 'auto_confirmation_enabled', default: true })
  autoConfirmationEnabled: boolean;

  // Rótulo personalizável do modal (ex.: "Urgente", "Retorno") + cor em hex.
  @Column({ length: 40, nullable: true })
  label: string;

  @Column({ name: 'label_color', length: 7, nullable: true })
  labelColor: string;

  // Preenchido quando esta consulta foi criada automaticamente como
  // retorno de outra (ver AppointmentsService.scheduleReturnIfRequested).
  @Column({ name: 'return_of_appointment_id', type: 'uuid', nullable: true })
  returnOfAppointmentId: string;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
