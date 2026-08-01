import { IsDateString, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  @Length(2, 150)
  name?: string;

  @IsString()
  @Length(1, 20)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
