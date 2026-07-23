import { Module } from '@nestjs/common';

/** Registro de pagamentos: dinheiro, PIX, cartão, convênio, boleto. */
@Module({})
export class PaymentsModule {}

// TODO: entities/payment.entity.ts (receivableId, method enum, amount, paidAt, installments)
// TODO: PaymentsService.registerPayment() -> emite 'payment.received' (Financial escuta e baixa a conta)
