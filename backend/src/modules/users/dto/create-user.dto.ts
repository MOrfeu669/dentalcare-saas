import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/interfaces/user-role.enum';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name?: string;

  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  password?: string;

  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  professionalLicense?: string;
}
