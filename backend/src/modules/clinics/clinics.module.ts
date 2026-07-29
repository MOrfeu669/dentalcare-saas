import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { ClinicsService } from './services/clinics.service';
import { ClinicsController } from './controllers/clinics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic])],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService], // AuthModule usa create()/findByCnpj() no fluxo de cadastro
})
export class ClinicsModule {}
