import { Injectable } from '@nestjs/common';
import { AnamnesisService } from './anamnesis.service';
import { ClinicalNotesService } from './clinical-notes.service';
import { OdontogramService } from './odontogram.service';
import { ClinicalFilesService } from './clinical-files.service';
import { TreatmentPlansService } from '../../treatment-plans/services/treatment-plans.service';
import { PatientsService } from '../../patients/services/patients.service';

/**
 * Não tem entidade própria — só agrega o que os outros services deste
 * módulo (e de TreatmentPlans) já expõem, pra alimentar a tela de
 * Prontuário eletrônico com uma chamada só em vez de 5.
 */
@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly anamnesisService: AnamnesisService,
    private readonly clinicalNotesService: ClinicalNotesService,
    private readonly odontogramService: OdontogramService,
    private readonly clinicalFilesService: ClinicalFilesService,
    private readonly treatmentPlansService: TreatmentPlansService,
  ) {}

  async getFullHistory(clinicId: string, patientId: string) {
    // valida que o paciente pertence à clínica antes de agregar qualquer coisa
    const patient = await this.patientsService.findOne(clinicId, patientId);

    const [anamnesis, notes, odontogram, files, treatmentPlans] = await Promise.all([
      this.anamnesisService.findByPatient(clinicId, patientId),
      this.clinicalNotesService.findByPatient(clinicId, patientId),
      this.odontogramService.findByPatient(clinicId, patientId),
      this.clinicalFilesService.findByPatient(clinicId, patientId),
      this.treatmentPlansService.findAll(clinicId, patientId),
    ]);

    return {
      patient: {
        id: patient.id,
        name: patient.name,
        birthDate: patient.birthDate,
      },
      anamnesis,
      notes,
      odontogram,
      files: files.map((f) => ({
        id: f.id,
        type: f.type,
        originalName: f.originalName,
        description: f.description,
        createdAt: f.createdAt,
      })),
      treatmentPlans,
    };
  }
}
