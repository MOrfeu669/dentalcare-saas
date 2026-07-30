import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateProcedureMaterialDto {
  @IsUUID()
  materialId?: string;

  // "Quantidade positiva" (item 4 do pedido) — Min(0.01) barra zero e negativo
  @IsNumber()
  @Min(0.01)
  quantity?: number;
}
