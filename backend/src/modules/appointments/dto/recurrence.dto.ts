import { IsIn, IsInt, Max, Min } from 'class-validator';

/**
 * Simplificado de propósito: só "toda semana, N vezes". Cobre o caso
 * de uso real mais comum (consulta semanal de ortodontia, por
 * exemplo) sem entrar em RRULE completo (dias específicos, término
 * por data, exceções) — isso fica como evolução futura se precisar.
 */
export class RecurrenceDto {
  @IsIn(['weekly'])
  frequency: 'weekly';

  @IsInt()
  @Min(2) // 1 ocorrência não é "recorrência", é só a consulta normal
  @Max(52) // não deixa gerar uma série absurda de 5 anos sem querer
  count: number;
}
