import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { PaginatedResult, PaginationParams } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(clinicId: string, dto: CreatePatientDto): Promise<Patient> {
    const existing = await this.patientRepository.findOne({
      where: { clinicId, cpf: dto.cpf },
    });
    if (existing) {
      throw new ConflictException('Já existe um paciente com este CPF nesta clínica');
    }

    const patient = this.patientRepository.create({ ...dto, clinicId });
    return this.patientRepository.save(patient);
  }

  async findAll(
    clinicId: string,
    { page = 1, limit = 20 }: PaginationParams,
    search?: string,
  ): Promise<PaginatedResult<Patient>> {
    const [data, total] = await this.patientRepository.findAndCount({
      where: {
        clinicId,
        active: true,
        ...(search ? { name: ILike(`%${search}%`) } : {}),
      },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(clinicId: string, id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { id, clinicId } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async update(clinicId: string, id: string, dto: UpdatePatientDto): Promise<Patient> {
    await this.findOne(clinicId, id); // garante que pertence à clínica
    await this.patientRepository.update({ id, clinicId }, dto);
    return this.findOne(clinicId, id);
  }

  async remove(clinicId: string, id: string): Promise<void> {
    await this.findOne(clinicId, id);
    await this.patientRepository.softDelete({ id, clinicId });
  }

  // Usado pelo módulo de Agenda/Prontuário para exibir um resumo rápido do
  // paciente sem carregar a entidade inteira (evita acoplamento de módulos).
  async getBasicInfo(clinicId: string, id: string) {
    const patient = await this.findOne(clinicId, id);
    return {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      whatsapp: patient.whatsapp,
      insuranceProvider: patient.insuranceProvider,
    };
  }

  /** Usado pelo relatório de Pacientes ("novos cadastros no período"). */
  findCreatedInRange(clinicId: string, from: Date, to: Date): Promise<Patient[]> {
    return this.patientRepository.find({
      where: { clinicId, createdAt: Between(from, to) },
      order: { createdAt: 'ASC' },
    });
  }

  countActive(clinicId: string): Promise<number> {
    return this.patientRepository.count({ where: { clinicId, active: true } });
  }
}
