import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment } from '../entities/payment.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { FinancialService } from '../../financial/services/financial.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly financialService: FinancialService, // nunca mexe direto no Repository de Receivable
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async registerPayment(clinicId: string, dto: CreatePaymentDto): Promise<Payment> {
    // Valida que a conta existe e pertence à clínica, e já aplica o
    // valor nela (lança BadRequestException se exceder o saldo devedor)
    // ANTES de gravar o pagamento — evita registrar um pagamento
    // "fantasma" que não bateu com o financeiro.
    await this.financialService.applyPayment(clinicId, dto.receivableId, dto.amount);

    const payment = this.paymentRepository.create({
      ...dto,
      clinicId,
      paidAt: new Date(),
    });
    const saved = await this.paymentRepository.save(payment);

    this.eventEmitter.emit('payment.received', {
      clinicId,
      paymentId: saved.id,
      receivableId: dto.receivableId,
      amount: dto.amount,
    });

    return saved;
  }

  findByReceivable(clinicId: string, receivableId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { clinicId, receivableId },
      order: { paidAt: 'DESC' },
    });
  }
}
