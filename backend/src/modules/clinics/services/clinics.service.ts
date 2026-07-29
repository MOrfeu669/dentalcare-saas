import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from '../entities/clinic.entity';
import { CreateClinicDto } from '../dto/create-clinic.dto';
import { UpdateClinicDto } from '../dto/update-clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  /**
   * Cria o tenant em si. Não cria usuário nenhum — isso é
   * responsabilidade de quem chama (ver AuthService.registerClinic,
   * que cria a Clinic e o primeiro User admin na mesma operação).
   */
  async create(dto: CreateClinicDto): Promise<Clinic> {
    const existing = await this.clinicRepository.findOne({ where: { cnpj: dto.cnpj } });
    if (existing) {
      throw new ConflictException('Já existe uma clínica cadastrada com este CNPJ.');
    }
    const clinic = this.clinicRepository.create(dto);
    return this.clinicRepository.save(clinic);
  }

  async findByCnpj(cnpj: string): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({ where: { cnpj } });
    if (!clinic) {
      throw new NotFoundException('Nenhuma clínica encontrada com este CNPJ.');
    }
    return clinic;
  }

  async findOne(id: string): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({ where: { id } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada');
    return clinic;
  }

  async update(id: string, dto: UpdateClinicDto): Promise<Clinic> {
    await this.findOne(id);
    await this.clinicRepository.update(id, dto);
    return this.findOne(id);
  }
}
