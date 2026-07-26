import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/base/tenant-base.entity';

export enum ClinicalFileType {
  RADIOGRAPH = 'radiograph',
  DOCUMENT = 'document',
  PHOTO = 'photo',
  OTHER = 'other',
}

@Entity('clinical_files')
@Index(['clinicId', 'patientId'])
export class ClinicalFile extends TenantBaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string; // userId

  @Column({ type: 'enum', enum: ClinicalFileType, default: ClinicalFileType.OTHER })
  type: ClinicalFileType;

  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  // Caminho relativo a STORAGE_LOCAL_PATH — nunca o caminho absoluto do
  // servidor, pra não vazar estrutura de disco se isso algum dia for
  // exposto em log/erro.
  @Column({ name: 'storage_path', length: 500 })
  storagePath: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes: number;

  @Column({ type: 'text', nullable: true })
  description: string;
}
