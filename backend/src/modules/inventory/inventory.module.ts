import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { MaterialsService } from './services/materials.service';
import { StockMovementsService } from './services/stock-movements.service';
import { MaterialsController } from './controllers/materials.controller';
import { StockMovementsController } from './controllers/stock-movements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Material, StockMovement])],
  controllers: [MaterialsController, StockMovementsController],
  providers: [MaterialsService, StockMovementsService],
  exports: [MaterialsService, StockMovementsService],
})
export class InventoryModule {}

// TODO próximos passos deste módulo:
// - entities/procedure-material.entity.ts (procedureId, materialId, quantityUsed)
//   -> "receita" de consumo por procedimento
// - @OnEvent('treatment-plan-item.completed') InventoryService.consumeForProcedure(...)
//   -> dá baixa automática nos materiais da receita (requisito "consumo automático por procedimento")
// - Cron diário (@nestjs/schedule) varrendo findLowStock() e emitindo 'inventory.low-stock'
//   em lote (hoje o evento só dispara no momento exato em que uma saída de estoque cruza o mínimo)
