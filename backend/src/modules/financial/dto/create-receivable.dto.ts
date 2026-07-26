import { IsDateString, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateReceivableDto {
  @IsUUID()
  patientId: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  dueDate: string;
}
