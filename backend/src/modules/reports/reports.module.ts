import { Module } from '@nestjs/common';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientsModule } from '../patients/patients.module';
import { InventoryModule } from '../inventory/inventory.module';
import { FinancialModule } from '../financial/financial.module';
import { PaymentsModule } from '../payments/payments.module';
import { TreatmentPlansModule } from '../treatment-plans/treatment-plans.module';
import { UsersModule } from '../users/users.module';
import { ProceduresModule } from '../procedures/procedures.module';

@Module({
  imports: [
    AppointmentsModule,
    PatientsModule,
    InventoryModule,
    FinancialModule,
    PaymentsModule,
    TreatmentPlansModule,
    UsersModule,
    ProceduresModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
