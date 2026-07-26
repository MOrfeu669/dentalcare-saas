import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalNote } from '../entities/clinical-note.entity';
import { CreateClinicalNoteDto } from '../dto/create-clinical-note.dto';

@Injectable()
export class ClinicalNotesService {
  constructor(
    @InjectRepository(ClinicalNote)
    private readonly clinicalNoteRepository: Repository<ClinicalNote>,
  ) {}

  create(clinicId: string, dentistId: string, dto: CreateClinicalNoteDto): Promise<ClinicalNote> {
    const note = this.clinicalNoteRepository.create({ ...dto, clinicId, dentistId });
    return this.clinicalNoteRepository.save(note);
  }

  findByPatient(clinicId: string, patientId: string): Promise<ClinicalNote[]> {
    return this.clinicalNoteRepository.find({
      where: { clinicId, patientId },
      order: { createdAt: 'DESC' },
    });
  }
}
