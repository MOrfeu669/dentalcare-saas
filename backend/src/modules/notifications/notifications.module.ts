import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NOTIFICATION_SENDER } from './senders/notification-sender.interface';
import { ConsoleNotificationSender } from './senders/console-notification.sender';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog]),
    AppointmentsModule,
    PatientsModule,
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    // Troca de provider é só isso — nada mais no módulo muda quando um
    // sender de WhatsApp/SMS/SMTP real existir.
    { provide: NOTIFICATION_SENDER, useClass: ConsoleNotificationSender },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
