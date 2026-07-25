import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DentistProfile } from './entities/dentist-profile.entity';
import { DentistsService } from './services/dentists.service';
import { DentistsController } from './controllers/dentists.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([DentistProfile]), UsersModule],
  controllers: [DentistsController],
  providers: [DentistsService],
  exports: [DentistsService], // Appointments vai consumir getWorkingHoursForDay() por aqui
})
export class DentistsModule {}

