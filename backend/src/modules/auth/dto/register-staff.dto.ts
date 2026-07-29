import { IsEmail, IsIn, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { UserRole } from '../../../common/interfaces/user-role.enum';

export class RegisterStaffDto {
  // Identifica a clínica à qual esta pessoa está se vinculando — não
  // existe um "cadastro solto" sem clínica, todo mundo pertence a um tenant.
  @IsString()
  @Length(14, 18)
  clinicCnpj: string;

  @IsString()
  @Length(2, 150)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  password: string;

  // De propósito só aceita DENTIST/RECEPTIONIST — admin nasce junto
  // com a clínica (RegisterClinicDto), nunca por este endpoint.
  @IsIn([UserRole.DENTIST, UserRole.RECEPTIONIST])
  role: UserRole.DENTIST | UserRole.RECEPTIONIST;

  @IsOptional()
  @IsString()
  professionalLicense?: string; // obrigatório na prática quando role = dentist (validado no service)
}
