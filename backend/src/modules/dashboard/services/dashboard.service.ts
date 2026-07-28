import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { MaterialsService } from '../../inventory/services/materials.service';
import { FinancialService } from '../../financial/services/financial.service';
import { PaymentsService } from '../../payments/services/payments.service';
import { TreatmentPlansService } from '../../treatment-plans/services/treatment-plans.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationStatus } from '../../notifications/entities/notification-log.entity';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Não tem entidade nem repository próprio — só agrega o que os outros
 * services já expõem. Cada método aqui corresponde a um card definido
 * pelo usuário: Consultas de hoje, Pacientes aguardando, Próxima
 * consulta, Confirmações pendentes, Avisos importantes, Estoque
 * crítico, Recebimentos do dia, Procedimentos realizados hoje.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly materialsService: MaterialsService,
    private readonly financialService: FinancialService,
    private readonly paymentsService: PaymentsService,
    private readonly treatmentPlansService: TreatmentPlansService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getSummary(clinicId: string) {
    const [
      appointmentsToday,
      patientsWaiting,
      nextAppointment,
      pendingConfirmations,
      criticalStock,
      overdueReceivables,
      failedNotifications,
      paymentsToday,
      proceduresToday,
    ] = await Promise.all([
      this.appointmentsService.getDaySchedule(clinicId, new Date()),
      this.appointmentsService.findWaitingNow(clinicId),
      this.appointmentsService.findNext(clinicId),
      this.appointmentsService.findPendingConfirmations(clinicId),
      this.materialsService.findLowStock(clinicId),
      this.financialService.findOverdueReceivables(clinicId),
      this.notificationsService.findAll(clinicId, NotificationStatus.FAILED),
      this.paymentsService.findByDateRange(clinicId, startOfToday(), endOfToday()),
      this.treatmentPlansService.findItemsCompletedInRange(clinicId, startOfToday(), endOfToday()),
    ]);

    const receivedTodayTotal = paymentsToday.reduce((sum, p) => sum + Number(p.amount), 0);

    // "Avisos importantes" — feed único combinando estoque crítico,
    // contas vencidas e falhas de envio de notificação. Cada módulo
    // continua dono do seu dado; isto só normaliza pra exibição.
    const importantNotices = [
      ...criticalStock.map((m) => ({
        type: 'low_stock' as const,
        message: `${m.name}: estoque em ${m.currentStock} ${m.unit} (mínimo ${m.minStock})`,
      })),
      ...overdueReceivables.map((r) => ({
        type: 'overdue_receivable' as const,
        message: `Conta vencida: ${r.description} — R$ ${Number(r.amount - r.paidAmount).toFixed(2)} (venceu em ${r.dueDate})`,
      })),
      ...failedNotifications.map((n) => ({
        type: 'notification_failed' as const,
        message: `Falha ao notificar ${n.recipient}: ${n.errorMessage ?? 'motivo não informado'}`,
      })),
    ];

    return {
      appointmentsToday: {
        total: appointmentsToday.length,
        items: appointmentsToday,
      },
      patientsWaiting: {
        total: patientsWaiting.length,
        items: patientsWaiting,
      },
      nextAppointment,
      pendingConfirmations: {
        total: pendingConfirmations.length,
        items: pendingConfirmations,
      },
      importantNotices,
      criticalStock,
      receivedToday: {
        total: receivedTodayTotal,
        payments: paymentsToday,
      },
      proceduresCompletedToday: {
        total: proceduresToday.length,
        items: proceduresToday,
      },
    };
  }
}
