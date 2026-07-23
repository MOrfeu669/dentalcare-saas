import { Module } from '@nestjs/common';

/**
 * Indicadores em tempo real (consultas do dia, faturamento, lucro,
 * despesas, estoque baixo, procedimentos realizados, pacientes
 * cadastrados). Não tem entidades próprias — apenas agrega dados
 * dos outros módulos via seus services (nunca acessa outro repository
 * diretamente, respeitando a comunicação por camada de serviço).
 */
@Module({})
export class DashboardModule {}

// TODO: DashboardService.getSummary(clinicId) -> combina
//       AppointmentsService + FinancialService + InventoryService + PatientsService
