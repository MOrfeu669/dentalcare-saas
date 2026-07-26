import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receivable } from './entities/receivable.entity';
import { Payable } from './entities/payable.entity';
import { FinancialService } from './services/financial.service';
import { ReceivablesController } from './controllers/receivables.controller';
import { PayablesController } from './controllers/payables.controller';
import { CashFlowController } from './controllers/cash-flow.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Receivable, Payable])],
  controllers: [ReceivablesController, PayablesController, CashFlowController],
  providers: [FinancialService],
  exports: [FinancialService], // PaymentsModule usa applyPayment() por aqui
})
export class FinancialModule {}
