import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';
import { User } from '../../users/entities/user.entity';

interface WorkingHoursByDay {
  mon?: { open: string; close: string }[];
  tue?: { open: string; close: string }[];
  wed?: { open: string; close: string }[];
  thu?: { open: string; close: string }[];
  fri?: { open: string; close: string }[];
  sat?: { open: string; close: string }[];
  sun?: { open: string; close: string }[];
}

/**
 * Dados profissionais do dentista. O LOGIN em si já existe via
 * módulo Users (User com role = DENTIST); este registro é 1:1 com
 * User e guarda o que é específico da profissão (CRO já está em
 * User.professionalLicense; aqui ficam especialidades, expediente e
 * comissionamento).
 */
@Entity('dentist_profiles')
@Index(['clinicId', 'userId'], { unique: true })
export class DentistProfile extends TenantBaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  specialties: string[]; // ex.: ["Ortodontia", "Endodontia"]

  @Column({ type: 'jsonb', name: 'working_hours', nullable: true })
  workingHours: WorkingHoursByDay;

  // Usado no futuro pelo módulo Financial para cálculo de repasse por procedimento
  @Column({ name: 'commission_rate', type: 'numeric', precision: 5, scale: 2, nullable: true })
  commissionRate: number; // percentual, ex.: 30.00 = 30%

  @Column({ type: 'text', nullable: true })
  bio: string;

  // Cor padrão dos blocos deste dentista na agenda (hex). Cada
  // dentista define a própria — requisito explícito da tela de agenda.
  @Column({ name: 'agenda_color', length: 7, default: '#0F5E5A' })
  agendaColor: string;
}
