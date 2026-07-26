import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity';

export class CreateStockMovementDto {
  @IsUUID()
  materialId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsUUID()
  treatmentPlanItemId?: string;
}
