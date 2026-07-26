import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Odontogram } from '../entities/odontogram.entity';
import { UpdateToothDto } from '../dto/update-tooth.dto';

@Injectable()
export class OdontogramService {
  constructor(
    @InjectRepository(Odontogram)
    private readonly odontogramRepository: Repository<Odontogram>,
  ) {}

  async findByPatient(clinicId: string, patientId: string): Promise<Odontogram> {
    const existing = await this.odontogramRepository.findOne({ where: { clinicId, patientId } });
    if (existing) return existing;

    // Odontograma começa vazio na primeira consulta — cria sob demanda
    const created = this.odontogramRepository.create({ clinicId, patientId, teeth: {} });
    return this.odontogramRepository.save(created);
  }

  async updateTooth(
    clinicId: string,
    patientId: string,
    toothNumber: string,
    dto: UpdateToothDto,
  ): Promise<Odontogram> {
    const odontogram = await this.findByPatient(clinicId, patientId);

    odontogram.teeth = {
      ...odontogram.teeth,
      [toothNumber]: { ...dto, updatedAt: new Date().toISOString() },
    };

    await this.odontogramRepository.update({ clinicId, patientId }, { teeth: odontogram.teeth });
    return this.findByPatient(clinicId, patientId);
  }
}
