import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateClinicDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsString()
  @Length(14, 18)
  cnpj: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
