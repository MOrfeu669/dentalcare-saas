import { Module } from '@nestjs/common';

/** Fornecedores de materiais: cadastro, contatos, histórico de compras. */
@Module({})
export class SuppliersModule {}

// TODO: entities/supplier.entity.ts (name, cnpj, contacts jsonb)
// TODO: entities/purchase-order.entity.ts (supplierId, items[], totalValue, receivedAt)
