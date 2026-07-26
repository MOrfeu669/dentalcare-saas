import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentPlan } from './entities/treatment-plan.entity';
import { TreatmentPlansService } from './services/treatment-plans.service';
import { TreatmentPlansController } from './controllers/treatment-plans.controller';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { ProceduresModule } from '../procedures/procedures.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TreatmentPlan]),
    PatientsModule,
    UsersModule,
    ProceduresModule,
  ],
  controllers: [TreatmentPlansController],
  providers: [TreatmentPlansService],
  exports: [TreatmentPlansService],
})
export class TreatmentPlansModule {}

// TODO próximos passos deste módulo:
// - Financial escuta 'treatment-plan-item.completed' -> cria o receivable (contas a receber)
// - Appointments: ao criar consulta com treatmentPlanId + itemId, marcar item como SCHEDULED
// - GET /treatment-plans/patient/:patientId/summary — usado na tela de Prontuário
