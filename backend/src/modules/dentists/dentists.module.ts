import { Module } from '@nestjs/common';

/**
 * Cadastro de dentistas (dados profissionais: CRO, especialidades,
 * horários de atendimento por dia da semana, comissionamento).
 * O LOGIN do dentista já existe via módulo Users (role = DENTIST);
 * este módulo guarda os dados profissionais complementares.
 */
@Module({})
export class DentistsModule {}

// TODO: entities/dentist-profile.entity.ts (userId 1:1, specialties[], workingHours jsonb, commissionRate)
// TODO: DentistsService.getWorkingHours() — usado pelo AppointmentConflictCheckerService
//       para não sugerir horário fora do expediente do profissional
