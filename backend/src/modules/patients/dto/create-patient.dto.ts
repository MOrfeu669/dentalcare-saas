import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

class AddressDto {
  @IsString() street: string;
  @IsString() number: string;
  @IsOptional() @IsString() complement?: string;
  @IsString() neighborhood: string;
  @IsString() city: string;
  @IsString() @Length(2, 2) state: string;
  @IsString() zipCode: string;
}

class EmergencyContactDto {
  @IsString() name: string;
  @IsString() relationship: string;
  @IsString() phone: string;
}

export class CreatePatientDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsString()
  @Length(11, 14)
  cpf: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  insurancePlanNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @IsOptional()
  @IsString()
  observations?: string;
}
