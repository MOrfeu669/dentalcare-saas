import { Module } from '@nestjs/common';

/** Relatório gerencial: financeiro, agenda, estoque, pacientes, procedimentos — com dados cruzados. */
@Module({})
export class ReportsModule {}

// TODO: ReportsService.revenueByProfessional(clinicId, from, to)
// TODO: ReportsService.revenueByProcedure(clinicId, from, to)
// TODO: exportação para PDF (skill de PDF) e Excel (biblioteca exceljs) por endpoint,
//       ex.: GET /reports/financial?format=pdf|xlsx
