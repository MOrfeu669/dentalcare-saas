import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ToothCondition } from '../entities/odontogram.entity';

export class UpdateToothDto {
  @IsEnum(ToothCondition)
  condition: ToothCondition;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  procedureId?: string;
}
