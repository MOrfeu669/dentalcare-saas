import { Module } from '@nestjs/common';

/** Catálogo de procedimentos: nome, valor, tempo estimado, materiais consumidos. */
@Module({})
export class ProceduresModule {}

// TODO: entities/procedure.entity.ts (name, defaultValue, estimatedMinutes)
// TODO: entities/procedure-material.entity.ts (procedureId, materialId, quantityUsed)
//       -> ao concluir o procedimento, Inventory dá baixa automática nesses materiais
//          (requisito "consumo automático por procedimento")
