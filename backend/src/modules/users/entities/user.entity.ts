import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';
import { UserRole } from '../../../common/interfaces/user-role.enum';
import { Clinic } from '../../clinics/entities/clinic.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User extends TenantBaseEntity {
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 150 })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.RECEPTIONIST })
  role: UserRole;

  // Preenchido apenas quando role = DENTIST — vincula ao registro profissional
  @Column({ name: 'professional_license', nullable: true, length: 30 })
  professionalLicense: string; // CRO

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;
}
