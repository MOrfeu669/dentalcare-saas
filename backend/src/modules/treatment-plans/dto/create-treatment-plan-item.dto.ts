import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTreatmentPlanItemDto {
  @IsUUID()
  procedureId?: string;

  @IsOptional()
  @IsString()
  toothNumber?: string;

  // Se não informado, o service usa Procedure.name (evita repetir o
  // catálogo inteiro no front toda vez que alguém monta um orçamento)
  @IsOptional()
  @IsString()
  description?: string;

  // Se não informado, o service usa Procedure.defaultValue — mas o
  // dentista pode sobrescrever caso negocie um valor diferente com o paciente
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;
}
