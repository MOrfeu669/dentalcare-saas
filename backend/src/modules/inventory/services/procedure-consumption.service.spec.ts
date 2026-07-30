import { Test, TestingModule } from '@nestjs/testing';
import { ProcedureConsumptionService } from './procedure-consumption.service';
import { ProcedureMaterialsService } from './procedure-materials.service';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementType } from '../entities/stock-movement.entity';
import { BadRequestException } from '@nestjs/common';

describe('ProcedureConsumptionService', () => {
  let service: ProcedureConsumptionService;
  let procedureMaterialsService: jest.Mocked<Pick<ProcedureMaterialsService, 'findRecipeItems'>>;
  let stockMovementsService: jest.Mocked<Pick<StockMovementsService, 'register'>>;

  const clinicId = 'clinic-1';
  const basePayload = {
    clinicId,
    treatmentPlanId: 'plan-1',
    patientId: 'patient-1',
    dentistId: 'dentist-1',
    item: { id: 'item-1', procedureId: 'procedure-1', description: 'Restauração' },
  };

  beforeEach(async () => {
    procedureMaterialsService = { findRecipeItems: jest.fn() };
    stockMovementsService = { register: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcedureConsumptionService,
        { provide: ProcedureMaterialsService, useValue: procedureMaterialsService },
        { provide: StockMovementsService, useValue: stockMovementsService },
      ],
    }).compile();

    service = module.get(ProcedureConsumptionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('não consome nada quando o procedimento não tem receita cadastrada', async () => {
    procedureMaterialsService.findRecipeItems.mockResolvedValue([]);

    await service.handleTreatmentPlanItemCompleted(basePayload);

    expect(stockMovementsService.register).not.toHaveBeenCalled();
  });

  it('registra uma saída de estoque por material da receita, com os dados certos', async () => {
    procedureMaterialsService.findRecipeItems.mockResolvedValue([
      { id: 'pm-1', clinicId, procedureId: 'procedure-1', materialId: 'material-A', quantity: 2 } as any,
      { id: 'pm-2', clinicId, procedureId: 'procedure-1', materialId: 'material-B', quantity: 0.5 } as any,
    ]);
    stockMovementsService.register.mockResolvedValue({} as any);

    await service.handleTreatmentPlanItemCompleted(basePayload);

    expect(stockMovementsService.register).toHaveBeenCalledTimes(2);
    expect(stockMovementsService.register).toHaveBeenNthCalledWith(1, clinicId, {
      materialId: 'material-A',
      type: StockMovementType.OUT,
      quantity: 2,
      reason: expect.stringContaining('item-1'),
      treatmentPlanItemId: 'item-1',
    });
    expect(stockMovementsService.register).toHaveBeenNthCalledWith(2, clinicId, {
      materialId: 'material-B',
      type: StockMovementType.OUT,
      quantity: 0.5,
      reason: expect.stringContaining('item-1'),
      treatmentPlanItemId: 'item-1',
    });
  });

  it('isola a falha de um material (ex.: saldo insuficiente) e continua consumindo os demais', async () => {
    procedureMaterialsService.findRecipeItems.mockResolvedValue([
      { id: 'pm-1', clinicId, procedureId: 'procedure-1', materialId: 'material-SEM-SALDO', quantity: 999 } as any,
      { id: 'pm-2', clinicId, procedureId: 'procedure-1', materialId: 'material-B', quantity: 1 } as any,
    ]);
    stockMovementsService.register
      .mockRejectedValueOnce(new BadRequestException('Estoque insuficiente'))
      .mockResolvedValueOnce({} as any);

    // Não deve propagar a exceção — a falha de um material é isolada.
    await expect(service.handleTreatmentPlanItemCompleted(basePayload)).resolves.not.toThrow();

    // O segundo material da receita ainda deve ser processado.
    expect(stockMovementsService.register).toHaveBeenCalledTimes(2);
    expect(stockMovementsService.register).toHaveBeenNthCalledWith(
      2,
      clinicId,
      expect.objectContaining({ materialId: 'material-B' }),
    );
  });

  it('busca a receita usando clinicId e procedureId do payload do evento', async () => {
    procedureMaterialsService.findRecipeItems.mockResolvedValue([]);

    await service.handleTreatmentPlanItemCompleted(basePayload);

    expect(procedureMaterialsService.findRecipeItems).toHaveBeenCalledWith(clinicId, 'procedure-1');
  });
});
