import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Procedure } from '../entities/procedure.entity';
import { CreateProcedureDto } from '../dto/create-procedure.dto';
import { UpdateProcedureDto } from '../dto/update-procedure.dto';

@Injectable()
export class ProceduresService {
  constructor(
    @InjectRepository(Procedure)
    private readonly procedureRepository: Repository<Procedure>,
  ) {}

  async create(clinicId: string, dto: CreateProcedureDto): Promise<Procedure> {
    const existing = await this.procedureRepository.findOne({ where: { clinicId, name: dto.name } });
    if (existing) {
      throw new ConflictException('Já existe um procedimento com este nome nesta clínica');
    }
    const procedure = this.procedureRepository.create({ ...dto, clinicId });
    return this.procedureRepository.save(procedure);
  }

  findAll(clinicId: string, onlyActive = true): Promise<Procedure[]> {
    return this.procedureRepository.find({
      where: onlyActive ? { clinicId, active: true } : { clinicId },
      order: { name: 'ASC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<Procedure> {
    const procedure = await this.procedureRepository.findOne({ where: { id, clinicId } });
    if (!procedure) throw new NotFoundException('Procedimento não encontrado');
    return procedure;
  }

  async update(clinicId: string, id: string, dto: UpdateProcedureDto): Promise<Procedure> {
    await this.findOne(clinicId, id);
    await this.procedureRepository.update({ id, clinicId }, dto);
    return this.findOne(clinicId, id);
  }

  /** Não apaga — pode estar referenciado em planos de tratamento antigos. */
  async deactivate(clinicId: string, id: string): Promise<Procedure> {
    await this.findOne(clinicId, id);
    await this.procedureRepository.update({ id, clinicId }, { active: false });
    return this.findOne(clinicId, id);
  }
}
