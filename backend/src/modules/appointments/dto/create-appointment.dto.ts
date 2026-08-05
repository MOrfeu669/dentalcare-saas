import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AppointmentType } from '../interfaces/appointment-type.enum';
import { ReturnScheduleDto } from './return-schedule.dto';
import { RecurrenceDto } from './recurrence.dto';

export class CreateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType = AppointmentType.CONSULTATION;

  // Obrigatório só na aba "Consulta" — "Compromisso" não tem paciente.
  @ValidateIf((o) => (o.type ?? AppointmentType.CONSULTATION) === AppointmentType.CONSULTATION)
  @IsUUID()
  patientId?: string;

  // Obrigatório só na aba "Compromisso".
  @ValidateIf((o) => o.type === AppointmentType.COMMITMENT)
  @IsString()
  @Length(2, 150)
  title?: string;

  @IsUUID()
  dentistId: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @IsOptional()
  @IsUUID()
  treatmentPlanId?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @MaxLength(500, { message: 'Observações podem ter no máximo 500 caracteres' })
  notes?: string;

  // Switch "Confirmação automática" do modal.
  @IsOptional()
  @IsBoolean()
  autoConfirmationEnabled?: boolean = true;

  // Rótulo personalizável (texto + cor) do modal.
  @IsOptional()
  @IsString()
  @Length(1, 40)
  label?: string;

  @IsOptional()
  @IsHexColor()
  labelColor?: string;

  // "Retorno" — se presente, cria uma segunda consulta automaticamente
  // (mesma duração/paciente/dentista) na data calculada.
  @IsOptional()
  @ValidateNested()
  @Type(() => ReturnScheduleDto)
  returnSchedule?: ReturnScheduleDto;

  // "Eventos recorrentes" — se presente, gera as ocorrências seguintes
  // já na criação (ver AppointmentsService.createRecurringSeries).
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;
}
