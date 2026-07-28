import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { PatientsService } from '../../patients/services/patients.service';
import { MaterialsService } from '../../inventory/services/materials.service';
import { FinancialService } from '../../financial/services/financial.service';
import { PaymentsService } from '../../payments/services/payments.service';
import { TreatmentPlansService } from '../../treatment-plans/services/treatment-plans.service';
import { UsersService } from '../../users/services/users.service';
import { ProceduresService } from '../../procedures/services/procedures.service';

/**
 * Sem entidade/repository próprio — cada relatório é uma composição
 * do que os services de domínio já expõem. Retorna dados estruturados
 * (JSON); exportação para PDF/Excel ainda não está implementada (ver
 * TODO no controller) — os dados aqui já são o suficiente pra isso
 * ser só uma camada de serialização em cima, sem tocar nesta lógica.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly patientsService: PatientsService,
    private readonly materialsService: MaterialsService,
    private readonly financialService: FinancialService,
    private readonly paymentsService: PaymentsService,
    private readonly treatmentPlansService: TreatmentPlansService,
    private readonly usersService: UsersService,
    private readonly proceduresService: ProceduresService,
  ) {}

  /** Financeiro: recebido, pendente, pago a fornecedores e saldo no período. */
  async financialReport(clinicId: string, from: Date, to: Date) {
    const [cashFlow, payments, overdue] = await Promise.all([
      this.financialService.getCashFlow(clinicId, from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)),
      this.paymentsService.findByDateRange(clinicId, from, to),
      this.financialService.findOverdueReceivables(clinicId),
    ]);

    const byMethod = payments.reduce<Record<string, number>>((acc, p) => {
      acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
      return acc;
    }, {});

    return { ...cashFlow, paymentsCount: payments.length, byMethod, overdueCount: overdue.length };
  }

  /** Agenda: quantas consultas por status e por profissional no período. */
  async agendaReport(clinicId: string, from: Date, to: Date) {
    const appointments = await this.appointmentsService.findInRange(clinicId, from, to);

    const byStatus = appointments.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});

    const byDentist = appointments.reduce<Record<string, number>>((acc, a) => {
      acc[a.dentistId] = (acc[a.dentistId] ?? 0) + 1;
      return acc;
    }, {});

    return {
      period: { from, to },
      total: appointments.length,
      byStatus,
      byDentist,
    };
  }

  /** Estoque: posição atual e materiais em estado crítico. */
  async inventoryReport(clinicId: string) {
    const [all, lowStock] = await Promise.all([
      this.materialsService.findAll(clinicId),
      this.materialsService.findLowStock(clinicId),
    ]);
    return {
      totalMaterials: all.length,
      lowStockCount: lowStock.length,
      materials: all,
      lowStock,
    };
  }

  /** Pacientes: total ativo e novos cadastros no período. */
  async patientsReport(clinicId: string, from: Date, to: Date) {
    const [totalActive, newPatients] = await Promise.all([
      this.patientsService.countActive(clinicId),
      this.patientsService.findCreatedInRange(clinicId, from, to),
    ]);
    return {
      period: { from, to },
      totalActive,
      newInPeriod: newPatients.length,
      newPatients,
    };
  }

  /**
   * Procedimentos: receita por procedimento e por profissional no
   * período — os dois TODOs que já estavam anotados no stub original
   * deste módulo.
   */
  async proceduresReport(clinicId: string, from: Date, to: Date) {
    const items = await this.treatmentPlansService.findItemsCompletedInRange(clinicId, from, to);

    const byProcedure = new Map<string, { count: number; total: number }>();
    const byDentist = new Map<string, { count: number; total: number }>();

    for (const item of items) {
      const proc = byProcedure.get(item.procedureId) ?? { count: 0, total: 0 };
      proc.count += 1;
      proc.total += Number(item.estimatedValue);
      byProcedure.set(item.procedureId, proc);

      const dentist = byDentist.get(item.dentistId) ?? { count: 0, total: 0 };
      dentist.count += 1;
      dentist.total += Number(item.estimatedValue);
      byDentist.set(item.dentistId, dentist);
    }

    // Resolve nomes — sem isso o relatório seria só uma lista de UUIDs
    const [procedureEntries, dentistEntries] = await Promise.all([
      Promise.all(
        [...byProcedure.entries()].map(async ([procedureId, stats]) => {
          const procedure = await this.proceduresService.findOne(clinicId, procedureId).catch(() => null);
          return { procedureId, name: procedure?.name ?? '(procedimento removido)', ...stats };
        }),
      ),
      Promise.all(
        [...byDentist.entries()].map(async ([dentistId, stats]) => {
          const dentist = await this.usersService.findByIdInClinic(dentistId, clinicId).catch(() => null);
          return { dentistId, name: dentist?.name ?? '(profissional removido)', ...stats };
        }),
      ),
    ]);

    return {
      period: { from, to },
      totalProcedures: items.length,
      totalRevenue: items.reduce((sum, i) => sum + Number(i.estimatedValue), 0),
      revenueByProcedure: procedureEntries.sort((a, b) => b.total - a.total),
      revenueByProfessional: dentistEntries.sort((a, b) => b.total - a.total),
    };
  }
}
