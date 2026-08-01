import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TreatmentPlan,
  TreatmentPlanItem,
  TreatmentPlanItemStatus,
  TreatmentPlanStatus,
} from '../entities/treatment-plan.entity';
import { CreateTreatmentPlanDto } from '../dto/create-treatment-plan.dto';
import { PatientsService } from '../../patients/services/patients.service';
import { UsersService } from '../../users/services/users.service';
import { ProceduresService } from '../../procedures/services/procedures.service';
import { UserRole } from '../../../common/interfaces/user-role.enum';

/** Transições de status permitidas — evita pular etapas por engano via API. */
const ALLOWED_TRANSITIONS: Record<TreatmentPlanStatus, TreatmentPlanStatus[]> = {
  [TreatmentPlanStatus.DRAFT]: [TreatmentPlanStatus.PROPOSED, TreatmentPlanStatus.CANCELLED],
  [TreatmentPlanStatus.PROPOSED]: [
    TreatmentPlanStatus.ACCEPTED,
    TreatmentPlanStatus.DRAFT,
    TreatmentPlanStatus.CANCELLED,
  ],
  [TreatmentPlanStatus.ACCEPTED]: [TreatmentPlanStatus.IN_PROGRESS, TreatmentPlanStatus.CANCELLED],
  [TreatmentPlanStatus.IN_PROGRESS]: [TreatmentPlanStatus.COMPLETED, TreatmentPlanStatus.CANCELLED],
  [TreatmentPlanStatus.COMPLETED]: [],
  [TreatmentPlanStatus.CANCELLED]: [],
};

@Injectable()
export class TreatmentPlansService {
  constructor(
    @InjectRepository(TreatmentPlan)
    private readonly treatmentPlanRepository: Repository<TreatmentPlan>,
    private readonly patientsService: PatientsService,
    private readonly usersService: UsersService,
    private readonly proceduresService: ProceduresService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(clinicId: string, dto: CreateTreatmentPlanDto): Promise<TreatmentPlan> {
    // Garante que paciente e dentista realmente pertencem a esta clínica
    // (nunca confia em IDs vindos do body sem checar o tenant)
    if (!dto.items?.length) {
      throw new BadRequestException('O plano precisa ter ao menos um item.');
    }

    await this.patientsService.findOne(clinicId, dto.patientId);

    const dentist = await this.usersService.findByIdInClinic(dto.dentistId, clinicId);
    if (dentist.role !== UserRole.DENTIST) {
      throw new BadRequestException('O usuário indicado como dentista não tem esse perfil.');
    }

    const items: TreatmentPlanItem[] = [];
    for (const itemDto of dto.items) {
      if (!itemDto.procedureId) {
        throw new BadRequestException('Cada item do plano precisa de um procedureId.');
      }

      const procedure = await this.proceduresService.findOne(clinicId, itemDto.procedureId);
      items.push({
        id: randomUUID(),
        procedureId: procedure.id,
        toothNumber: itemDto.toothNumber,
        description: itemDto.description ?? procedure.name,
        estimatedValue: itemDto.estimatedValue ?? Number(procedure.defaultValue),
        status: TreatmentPlanItemStatus.PENDING,
      });
    }

    const totalEstimatedValue = items.reduce((sum, item) => sum + Number(item.estimatedValue), 0);

    const plan = this.treatmentPlanRepository.create({
      clinicId,
      patientId: dto.patientId,
      dentistId: dto.dentistId,
      items,
      totalEstimatedValue,
      notes: dto.notes,
      status: TreatmentPlanStatus.DRAFT,
    });
    return this.treatmentPlanRepository.save(plan);
  }

  findAll(clinicId: string, patientId?: string): Promise<TreatmentPlan[]> {
    return this.treatmentPlanRepository.find({
      where: patientId ? { clinicId, patientId } : { clinicId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<TreatmentPlan> {
    const plan = await this.treatmentPlanRepository.findOne({ where: { id, clinicId } });
    if (!plan) throw new NotFoundException('Plano de tratamento não encontrado');
    return plan;
  }

  async updateStatus(
    clinicId: string,
    id: string,
    nextStatus: TreatmentPlanStatus,
  ): Promise<TreatmentPlan> {
    const plan = await this.findOne(clinicId, id);

    const allowed = ALLOWED_TRANSITIONS[plan.status];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Não é possível mudar de "${plan.status}" para "${nextStatus}".`,
      );
    }

    await this.treatmentPlanRepository.update({ id, clinicId }, { status: nextStatus });
    return this.findOne(clinicId, id);
  }

  /**
   * Marca um item como concluído e emite o evento que, no futuro, o
   * FinancialModule vai escutar para lançar o valor a receber
   * (requisito "Financeiro integrado"). Se todos os itens do plano
   * ficarem concluídos, o plano inteiro passa para COMPLETED.
   */
  async completeItem(clinicId: string, id: string, itemId: string): Promise<TreatmentPlan> {
    const plan = await this.findOne(clinicId, id);

    const item = plan.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Item do plano não encontrado');

    item.status = TreatmentPlanItemStatus.COMPLETED;
    item.completedAt = new Date().toISOString();

    const allCompleted = plan.items.every((i) => i.status === TreatmentPlanItemStatus.COMPLETED);
    const newStatus = allCompleted ? TreatmentPlanStatus.COMPLETED : plan.status;

    await this.treatmentPlanRepository.update(
      { id, clinicId },
      { items: plan.items, status: newStatus },
    );

    this.eventEmitter.emit('treatment-plan-item.completed', {
      clinicId,
      treatmentPlanId: id,
      patientId: plan.patientId,
      dentistId: plan.dentistId,
      item,
    });

    return this.findOne(clinicId, id);
  }

  /**
   * Varre os planos da clínica e retorna, "achatados", os itens
   * concluídos dentro do período — usado pelo Dashboard ("Procedimentos
   * realizados hoje") e pelos Reports (receita por procedimento/profissional).
   * `completedAt` mora dentro do jsonb `items`, então o filtro é feito
   * em memória; para o volume de uma clínica isso é desprezível — se
   * crescer muito, dá pra migrar para uma tabela própria de histórico.
   */
  async findItemsCompletedInRange(clinicId: string, from: Date, to: Date) {
    const plans = await this.treatmentPlanRepository.find({ where: { clinicId } });

    return plans.flatMap((plan) =>
      plan.items
        .filter((item) => {
          if (item.status !== TreatmentPlanItemStatus.COMPLETED || !item.completedAt) return false;
          const completedAt = new Date(item.completedAt);
          return completedAt >= from && completedAt <= to;
        })
        .map((item) => ({
          ...item,
          treatmentPlanId: plan.id,
          patientId: plan.patientId,
          dentistId: plan.dentistId,
        })),
    );
  }
}
