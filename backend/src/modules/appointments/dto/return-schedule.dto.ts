import { IsDateString, IsIn, IsOptional, ValidateIf } from 'class-validator';

/**
 * Ou `days` (7/15/30) ou `specificDate` — nunca os dois. O retorno
 * herda paciente/dentista/duração da consulta original, só muda a data.
 */
export class ReturnScheduleDto {
  @ValidateIf((o) => !o.specificDate)
  @IsIn([7, 15, 30])
  days?: number;

  @ValidateIf((o) => !o.days)
  @IsDateString()
  specificDate?: string;
}
