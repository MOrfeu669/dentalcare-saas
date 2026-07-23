import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { PatientsModule } from './modules/patients/patients.module';
import { DentistsModule } from './modules/dentists/dentists.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { TreatmentPlansModule } from './modules/treatment-plans/treatment-plans.module';
import { ProceduresModule } from './modules/procedures/procedures.module';
import { FinancialModule } from './modules/financial/financial.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [],
      useFactory: () => require('./config/database.config').default(),
    }),
    EventEmitterModule.forRoot(), // usado para comunicação desacoplada entre módulos (ex.: Appointments -> Notifications)
    ScheduleModule.forRoot(), // cron jobs: lembretes, checagem de estoque baixo

    // Infra / transversais
    AuditModule,

    // Domínio
    AuthModule,
    UsersModule,
    ClinicsModule,
    PatientsModule,
    DentistsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    TreatmentPlansModule,
    ProceduresModule,
    FinancialModule,
    PaymentsModule,
    InventoryModule,
    SuppliersModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
    SettingsModule,
  ],
  providers: [
    // Toda rota exige JWT válido por padrão (libera só quem tem @Public()),
    // e dentro disso respeita @Roles() quando presente.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
