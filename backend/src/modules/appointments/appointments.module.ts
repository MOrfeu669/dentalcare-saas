import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Room } from './entities/room.entity';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentConflictCheckerService } from './services/appointment-conflict-checker.service';
import { RoomsService } from './services/rooms.service';
import { AppointmentsController } from './controllers/appointments.controller';
import { RoomsController } from './controllers/rooms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Room])],
  controllers: [AppointmentsController, RoomsController],
  providers: [AppointmentsService, AppointmentConflictCheckerService, RoomsService],
  exports: [AppointmentsService, RoomsService],
})
export class AppointmentsModule {}

// TODO próximos passos deste módulo:
// - GET /appointments/available-slots?dentistId=&date= — sugestão de horários livres
//   (cruzar DentistsService.getWorkingHoursForDay() com AppointmentConflictCheckerService)
// - Listener em Notifications: on('appointment.created') agenda lembrete automático
