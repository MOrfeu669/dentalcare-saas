import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Procedure } from './entities/procedure.entity';
import { ProceduresService } from './services/procedures.service';
import { ProceduresController } from './controllers/procedures.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Procedure])],
  controllers: [ProceduresController],
  providers: [ProceduresService],
  exports: [ProceduresService], // TreatmentPlans consulta valor/nome padrão por aqui
})
export class ProceduresModule {}

