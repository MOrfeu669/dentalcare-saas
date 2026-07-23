import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Room } from './entities/room.entity';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentConflictCheckerService } from './services/appointment-conflict-checker.service';
import { AppointmentsController } from './controllers/appointments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Room])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentConflictCheckerService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

// TODO próximos passos deste módulo:
// - RoomsController (CRUD simples de salas/cadeiras)
// - GET /appointments/available-slots?dentistId=&date= — sugestão de horários livres
// - Listener em Notifications: on('appointment.created') agenda lembrete automático
