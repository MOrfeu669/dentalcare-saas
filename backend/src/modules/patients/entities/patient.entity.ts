import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

@Entity('patients')
@Index(['clinicId', 'cpf'], { unique: true })
export class Patient extends TenantBaseEntity {
  @Column({ length: 150 })
  name: string;

  @Column({ length: 14 })
  cpf: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate: string;

  @Column({ length: 30 })
  phone: string;

  @Column({ length: 30, nullable: true })
  whatsapp: string; // usado pelo módulo de Notifications para lembretes automáticos

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // Convênio odontológico do paciente (se houver)
  @Column({ name: 'insurance_provider', length: 100, nullable: true })
  insuranceProvider: string;

  @Column({ name: 'insurance_plan_number', length: 50, nullable: true })
  insurancePlanNumber: string;

  // Contato de emergência / responsável (relevante para pacientes menores de idade)
  @Column({ type: 'jsonb', nullable: true, name: 'emergency_contact' })
  emergencyContact: { name: string; relationship: string; phone: string };

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ default: true })
  active: boolean;
}
