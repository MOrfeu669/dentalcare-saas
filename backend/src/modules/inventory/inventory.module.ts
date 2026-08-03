import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { ProcedureMaterial } from './entities/procedure-material.entity';
import { MaterialsService } from './services/materials.service';
import { StockMovementsService } from './services/stock-movements.service';
import { ProcedureMaterialsService } from './services/procedure-materials.service';
import { ProcedureConsumptionService } from './services/procedure-consumption.service';
import { MaterialsController } from './controllers/materials.controller';
import { StockMovementsController } from './controllers/stock-movements.controller';
import { ProcedureMaterialsController } from './controllers/procedure-materials.controller';
import { ProceduresModule } from '../procedures/procedures.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, StockMovement, ProcedureMaterial]),
    ProceduresModule, // só nesta direção — evita dependência circular (ver nota na entidade)
  ],
  controllers: [MaterialsController, StockMovementsController, ProcedureMaterialsController],
  providers: [
    MaterialsService,
    StockMovementsService,
    ProcedureMaterialsService,
    ProcedureConsumptionService,
  ],
  exports: [MaterialsService, StockMovementsService, ProcedureMaterialsService],
})
export class InventoryModule {}

// TODO próximos passos deste módulo:
// - Cron diário (@nestjs/schedule) varrendo findLowStock() e emitindo 'inventory.low-stock'
//   em lote (hoje o evento só dispara no momento exato em que uma saída de estoque cruza o mínimo)
