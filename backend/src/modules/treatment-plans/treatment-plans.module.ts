import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentPlan } from './entities/treatment-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentPlan])],
  exports: [TypeOrmModule],
})
export class TreatmentPlansModule {}

// TODO próximos passos deste módulo (depende de Patients + Procedures prontos):
// - CreateTreatmentPlanDto / TreatmentPlansService.create() — monta o orçamento
// - PATCH /treatment-plans/:id/items/:itemId/complete
//     -> emite 'treatment-plan-item.completed' (Financial escuta e lança o valor a receber)
// - GET /treatment-plans/patient/:patientId — histórico de planos do paciente
//     (usado na tela de Prontuário eletrônico)
