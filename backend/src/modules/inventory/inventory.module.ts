import { Module } from '@nestjs/common';

/** Estoque de materiais: entrada/saída, validade, estoque mínimo, alertas. */
@Module({})
export class InventoryModule {}

// TODO: entities/material.entity.ts (name, unit, minStock, currentStock, expirationDate)
// TODO: entities/stock-movement.entity.ts (materialId, type IN|OUT, quantity, reason, appointmentId?)
// TODO: @Cron diário: InventoryService.checkLowStock() -> emite evento para Notifications
//       (requisito "possível notificação em caso de falta de material")
