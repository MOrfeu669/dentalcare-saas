import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic])],
  exports: [TypeOrmModule],
})
export class ClinicsModule {}

// TODO próximos passos deste módulo:
// - ClinicsService: create() (usado no onboarding de uma nova clínica no SaaS)
// - ClinicsController: GET/PATCH /clinics/me (configurações gerais, horário de funcionamento)
// - Validar CNPJ único na criação
