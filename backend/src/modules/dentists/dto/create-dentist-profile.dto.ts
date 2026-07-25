import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class DayScheduleDto {
  @IsString() open: string; // "08:00"
  @IsString() close: string; // "18:00"
}

class WorkingHoursDto {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayScheduleDto) mon?: DayScheduleDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayScheduleDto) tue?: DayScheduleDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayScheduleDto) wed?: DayScheduleDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayScheduleDto) thu?: DayScheduleDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayScheduleDto) fri?: DayScheduleDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayScheduleDto) sat?: DayScheduleDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DayScheduleDto) sun?: DayScheduleDto[];
}

export class CreateDentistProfileDto {
  // Precisa ser o id de um User já existente com role = DENTIST nesta clínica
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
