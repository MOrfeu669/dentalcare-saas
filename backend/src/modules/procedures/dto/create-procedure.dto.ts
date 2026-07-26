import { IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateProcedureDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0)
  defaultValue: number;

  @IsInt()
  @Min(1)
  estimatedMinutes: number;
}
