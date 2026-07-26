import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnamnesisRecord } from './entities/anamnesis-record.entity';
import { ClinicalNote } from './entities/clinical-note.entity';
import { Odontogram } from './entities/odontogram.entity';
import { ClinicalFile } from './entities/clinical-file.entity';

import { AnamnesisService } from './services/anamnesis.service';
import { ClinicalNotesService } from './services/clinical-notes.service';
import { OdontogramService } from './services/odontogram.service';
import { ClinicalFilesService } from './services/clinical-files.service';
import { MedicalRecordsService } from './services/medical-records.service';

import { AnamnesisController } from './controllers/anamnesis.controller';
import { ClinicalNotesController } from './controllers/clinical-notes.controller';
import { OdontogramController } from './controllers/odontogram.controller';
import { ClinicalFilesController } from './controllers/clinical-files.controller';
import { MedicalRecordsController } from './controllers/medical-records.controller';

import { PatientsModule } from '../patients/patients.module';
import { TreatmentPlansModule } from '../treatment-plans/treatment-plans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnamnesisRecord, ClinicalNote, Odontogram, ClinicalFile]),
    PatientsModule,
    TreatmentPlansModule,
  ],
  controllers: [
    AnamnesisController,
    ClinicalNotesController,
    OdontogramController,
    ClinicalFilesController,
    MedicalRecordsController,
  ],
  providers: [
    AnamnesisService,
    ClinicalNotesService,
    OdontogramService,
    ClinicalFilesService,
    MedicalRecordsService,
  ],
  exports: [AnamnesisService, ClinicalNotesService, OdontogramService, ClinicalFilesService],
})
export class MedicalRecordsModule {}
