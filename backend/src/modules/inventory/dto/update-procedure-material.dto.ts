import { IsNumber, Min } from 'class-validator';

export class UpdateProcedureMaterialDto {
  @IsNumber()
  @Min(0.01)
  quantity: number;
}
