import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { CreateTreatmentPlanItemDto } from './create-treatment-plan-item.dto';

export class CreateTreatmentPlanDto {
  @IsUUID()
  patientId?: string;

  @IsUUID()
  dentistId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'O plano precisa ter ao menos um procedimento' })
  @ValidateNested({ each: true })
  @Type(() => CreateTreatmentPlanItemDto)
  items?: CreateTreatmentPlanItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
