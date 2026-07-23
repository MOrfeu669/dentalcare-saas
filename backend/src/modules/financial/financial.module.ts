import { Module } from '@nestjs/common';

/**
 * Financeiro integrado: contas a receber/pagar, fluxo de caixa,
 * parcelamentos, inadimplência. Escuta eventos de outros módulos
 * (treatment-plan-item.completed, payment.received) em vez de ser
 * chamado diretamente por eles — mantém o acoplamento baixo.
 */
@Module({})
export class FinancialModule {}

// TODO: entities/receivable.entity.ts (patientId, treatmentPlanItemId, amount, dueDate, status)
// TODO: entities/payable.entity.ts    (supplierId?, description, amount, dueDate, status)
// TODO: @OnEvent('treatment-plan-item.completed') FinancialService.createReceivable(...)
// TODO: FinancialService.getCashFlow(clinicId, from, to) -> usado pelo Dashboard/Reports
