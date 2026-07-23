import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Clinic é o "tenant" do sistema. Não estende TenantBaseEntity porque
 * ela É a raiz do tenant — todas as outras entidades referenciam
 * clinic_id apontando para cá.
 */
@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 18, unique: true })
  cnpj: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true, name: 'business_hours' })
  businessHours: Record<string, { open: string; close: string }[]>;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
