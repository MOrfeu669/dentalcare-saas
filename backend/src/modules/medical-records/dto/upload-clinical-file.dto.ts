import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ClinicalFileType } from '../entities/clinical-file.entity';

export class UploadClinicalFileDto {
  @IsUUID()
  patientId: string;

  @IsEnum(ClinicalFileType)
  type: ClinicalFileType;

  @IsOptional()
  @IsString()
  description?: string;
}
