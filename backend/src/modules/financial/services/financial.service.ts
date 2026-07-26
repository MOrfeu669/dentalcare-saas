import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Receivable, ReceivableStatus } from '../entities/receivable.entity';
import { Payable, PayableStatus } from '../entities/payable.entity';
import { CreateReceivableDto } from '../dto/create-receivable.dto';
import { CreatePayableDto } from '../dto/create-payable.dto';

interface TreatmentPlanItemCompletedPayload {
  clinicId: string;
  treatmentPlanId: string;
  patientId: string;
  item: { id: string; description: string; estimatedValue: number };
}

@Injectable()
export class FinancialService {
  private readonly logger = new Logger('FinancialService');

  constructor(
    @InjectRepository(Receivable)
    private readonly receivableRepository: Repository<Receivable>,
    @InjectRepository(Payable)
    private readonly payableRepository: Repository<Payable>,
  ) {}

  /**
   * Requisito "Financeiro integrado": ao concluir um item de plano de
   * tratamento, lança a conta a receber automaticamente — sem
   * TreatmentPlansModule precisar saber que FinancialModule existe.
   */
  @OnEvent('treatment-plan-item.completed')
  async handleTreatmentPlanItemCompleted(payload: TreatmentPlanItemCompletedPayload) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // vencimento padrão: 30 dias — ajustável depois pelo usuário

    const receivable = this.receivableRepository.create({
      clinicId: payload.clinicId,
      patientId: payload.patientId,
      treatmentPlanItemId: payload.item.id,
      description: payload.item.description,
      amount: payload.item.estimatedValue,
      dueDate: dueDate.toISOString().slice(0, 10),
      status: ReceivableStatus.PENDING,
    });
    await this.receivableRepository.save(receivable);

    this.logger.log(
      `Conta a receber criada automaticamente: paciente ${payload.patientId}, item ${payload.item.id}, valor ${payload.item.estimatedValue}`,
    );
  }

  createReceivable(clinicId: string, dto: CreateReceivableDto): Promise<Receivable> {
    const receivable = this.receivableRepository.create({ ...dto, clinicId });
    return this.receivableRepository.save(receivable);
  }

  findReceivables(
    clinicId: string,
    filters: { patientId?: string; status?: ReceivableStatus } = {},
  ): Promise<Receivable[]> {
    return this.receivableRepository.find({
      where: { clinicId, ...filters },
      order: { dueDate: 'ASC' },
    });
  }

  async findReceivableOne(clinicId: string, id: string): Promise<Receivable> {
    const receivable = await this.receivableRepository.findOne({ where: { id, clinicId } });
    if (!receivable) throw new NotFoundException('Conta a receber não encontrada');
    return receivable;
  }

  /**
   * Chamado pelo PaymentsModule ao registrar um pagamento — nunca
   * chamado direto de fora, o Payments é quem sabe "quanto foi pago
   * agora", o Financial só aplica esse valor na conta.
   */
  async applyPayment(clinicId: string, receivableId: string, amountPaid: number): Promise<Receivable> {
    const receivable = await this.findReceivableOne(clinicId, receivableId);
    if (receivable.status === ReceivableStatus.CANCELLED) {
      throw new BadRequestException('Esta conta foi cancelada e não pode receber pagamentos.');
    }

    const newPaidAmount = Number(receivable.paidAmount) + amountPaid;
    if (newPaidAmount > Number(receivable.amount)) {
      throw new BadRequestException('O valor pago excede o valor da conta.');
    }

    const status =
      newPaidAmount >= Number(receivable.amount)
        ? ReceivableStatus.PAID
        : ReceivableStatus.PARTIALLY_PAID;

    await this.receivableRepository.update(
      { id: receivableId, clinicId },
      { paidAmount: newPaidAmount, status },
    );
    return this.findReceivableOne(clinicId, receivableId);
  }

  createPayable(clinicId: string, dto: CreatePayableDto): Promise<Payable> {
    const payable = this.payableRepository.create({ ...dto, clinicId });
    return this.payableRepository.save(payable);
  }

  findPayables(clinicId: string, status?: PayableStatus): Promise<Payable[]> {
    return this.payableRepository.find({
      where: { clinicId, ...(status ? { status } : {}) },
      order: { dueDate: 'ASC' },
    });
  }

  async markPayablePaid(clinicId: string, id: string): Promise<Payable> {
    const payable = await this.payableRepository.findOne({ where: { id, clinicId } });
    if (!payable) throw new NotFoundException('Conta a pagar não encontrada');

    await this.payableRepository.update(
      { id, clinicId },
      { status: PayableStatus.PAID, paidAt: new Date() },
    );
    return this.payableRepository.findOne({ where: { id, clinicId } }) as Promise<Payable>;
  }

  /** Fluxo de caixa simplificado: recebido menos pago, no período. */
  async getCashFlow(clinicId: string, from: string, to: string) {
    const [receivables, payables] = await Promise.all([
      this.receivableRepository.find({
        where: { clinicId, dueDate: Between(from, to) },
      }),
      this.payableRepository.find({
        where: { clinicId, dueDate: Between(from, to) },
      }),
    ]);

    const totalReceived = receivables.reduce((sum, r) => sum + Number(r.paidAmount), 0);
    const totalPending = receivables.reduce(
      (sum, r) => sum + (Number(r.amount) - Number(r.paidAmount)),
      0,
    );
    const totalPaidOut = payables
      .filter((p) => p.status === PayableStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      period: { from, to },
      totalReceived,
      totalPending,
      totalPaidOut,
      balance: totalReceived - totalPaidOut,
    };
  }
}
