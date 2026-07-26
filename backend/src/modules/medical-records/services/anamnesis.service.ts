import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnamnesisRecord } from '../entities/anamnesis-record.entity';
import { UpsertAnamnesisDto } from '../dto/upsert-anamnesis.dto';

@Injectable()
export class AnamnesisService {
  constructor(
    @InjectRepository(AnamnesisRecord)
    private readonly anamnesisRepository: Repository<AnamnesisRecord>,
  ) {}

  async findByPatient(clinicId: string, patientId: string): Promise<AnamnesisRecord | null> {
    return this.anamnesisRepository.findOne({ where: { clinicId, patientId } });
  }

  async upsert(
    clinicId: string,
    patientId: string,
    updatedBy: string,
    dto: UpsertAnamnesisDto,
  ): Promise<AnamnesisRecord> {
    const existing = await this.findByPatient(clinicId, patientId);

    if (existing) {
      const merged = { ...existing.answers, ...dto };
      await this.anamnesisRepository.update(
        { clinicId, patientId },
        { answers: merged, lastUpdatedBy: updatedBy },
      );
      return this.findByPatient(clinicId, patientId) as Promise<AnamnesisRecord>;
    }

    const record = this.anamnesisRepository.create({
      clinicId,
      patientId,
      answers: dto,
      lastUpdatedBy: updatedBy,
    });
    return this.anamnesisRepository.save(record);
  }
}
