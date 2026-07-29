import { PartialType } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import { CreateClinicDto } from './create-clinic.dto';

export class UpdateClinicDto extends PartialType(CreateClinicDto) {
  @IsOptional()
  @IsObject()
  businessHours?: Record<string, { open: string; close: string }[]>;
}
