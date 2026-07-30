import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProcedureMaterialsService } from './procedure-materials.service';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementType } from '../entities/stock-movement.entity';

interface TreatmentPlanItemCompletedPayload {
  clinicId: string;
  treatmentPlanId: string;
  patientId: string;
  dentistId?: string;
  item: { id: string; procedureId: string; description: string };
}

/**
 * Fecha o requisito "consumo automático por procedimento": ao concluir
 * um item de plano de tratamento, dá baixa em cada material da receita
 * do procedimento correspondente. Reaproveita StockMovementsService.register()
 * — mesma transação atômica e mesmo alerta de estoque baixo já usados
 * pelas movimentações manuais, nada duplicado aqui.
 */
@Injectable()
export class ProcedureConsumptionService {
  private readonly logger = new Logger('ProcedureConsumptionService');

  constructor(
    private readonly procedureMaterialsService: ProcedureMaterialsService,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  @OnEvent('treatment-plan-item.completed')
  async handleTreatmentPlanItemCompleted(payload: TreatmentPlanItemCompletedPayload) {
    const recipe = await this.procedureMaterialsService.findRecipeItems(
      payload.clinicId,
      payload.item.procedureId,
    );

    if (recipe.length === 0) {
      // Procedimento sem receita cadastrada ainda — não é erro, só não
      // há o que consumir (nem todo procedimento precisa de uma).
      return;
    }

    for (const recipeItem of recipe) {
      try {
        await this.stockMovementsService.register(payload.clinicId, {
          materialId: recipeItem.materialId,
          type: StockMovementType.OUT,
          quantity: recipeItem.quantity,
          reason: `Consumo automático — procedimento concluído (item ${payload.item.id})`,
          treatmentPlanItemId: payload.item.id,
        });
      } catch (error) {
        // Um material com saldo insuficiente não pode travar os demais
        // nem o fluxo clínico (o atendimento já aconteceu) — loga como
        // aviso operacional; o card "Avisos importantes" do Dashboard
        // já mostra estoque crítico separadamente.
        this.logger.warn(
          `Falha ao consumir material ${recipeItem.materialId} (receita do procedimento ${payload.item.procedureId}): ${(error as Error).message}`,
        );
      }
    }
  }
}
