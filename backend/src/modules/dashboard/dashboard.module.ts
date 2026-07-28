import { Module } from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { InventoryModule } from '../inventory/inventory.module';
import { FinancialModule } from '../financial/financial.module';
import { PaymentsModule } from '../payments/payments.module';
import { TreatmentPlansModule } from '../treatment-plans/treatment-plans.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AppointmentsModule,
    InventoryModule,
    FinancialModule,
    PaymentsModule,
    TreatmentPlansModule,
    NotificationsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
