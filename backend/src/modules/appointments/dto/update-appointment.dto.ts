import { IsHexColor, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

/**
 * Só os campos que fazem sentido editar depois de criado. Trocar
 * horário é sempre via /reschedule (mexe na checagem de conflito);
 * trocar tipo/paciente não é suportado — cancela e cria de novo.
 */
export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @MaxLength(500, { message: 'Observações podem ter no máximo 500 caracteres' })
  notes?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  label?: string;

  @IsOptional()
  @IsHexColor()
  labelColor?: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  title?: string;
}
