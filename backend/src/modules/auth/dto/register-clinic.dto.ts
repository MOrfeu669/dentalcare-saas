import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, MinLength, ValidateNested } from 'class-validator';
import { CreateClinicDto } from '../../clinics/dto/create-clinic.dto';

class ClinicAdminDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  password: string;
}

export class RegisterClinicDto {
  @ValidateNested()
  @Type(() => CreateClinicDto)
  clinic: CreateClinicDto;

  // O primeiro usuário da clínica nasce sempre como admin — não faz
  // sentido uma clínica existir sem ninguém com esse perfil.
  @ValidateNested()
  @Type(() => ClinicAdminDto)
  admin: ClinicAdminDto;
}
