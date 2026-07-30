import { IsEnum } from 'class-validator';
import { TreatmentPlanStatus } from '../entities/treatment-plan.entity';

export class UpdateTreatmentPlanStatusDto {
  @IsEnum(TreatmentPlanStatus)
  status?: TreatmentPlanStatus;
}
