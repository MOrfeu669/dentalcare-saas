import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

export enum ToothCondition {
  HEALTHY = 'healthy',
  CARIES = 'caries',
  RESTORED = 'restored',
  CROWN = 'crown',
  MISSING = 'missing',
  IMPLANT = 'implant',
  ROOT_CANAL = 'root_canal',
  EXTRACTION_INDICATED = 'extraction_indicated',
}

export interface ToothRecord {
  condition: ToothCondition;
  notes?: string;
  procedureId?: string; // último procedimento associado a este dente
  updatedAt: string; // ISO date — cada dente registra sua própria última alteração
}

/**
 * Numeração FDI (11–18, 21–28, 31–38, 41–48 para adultos; 51–85 para
 * decíduos) como chave do jsonb. Um único registro "atual" por
 * paciente — histórico de qual dentista mudou o quê fica no
 * AuditModule, não duplicado aqui.
 */
@Entity('odontograms')
@Index(['clinicId', 'patientId'], { unique: true })
export class Odontogram extends TenantBaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  teeth: Record<string, ToothRecord>;
}
