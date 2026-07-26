import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateClinicalNoteDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsString()
  @MinLength(3)
  content: string;
}
