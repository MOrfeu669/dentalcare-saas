import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientsService } from './services/patients.service';
import { PatientsController } from './controllers/patients.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService], // Appointments, MedicalRecords e TreatmentPlans consomem por aqui
})
export class PatientsModule {}
