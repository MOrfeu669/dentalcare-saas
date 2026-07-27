import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { ReplyNotificationDto } from '../dto/reply-notification.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';
import { NotificationStatus } from '../entities/notification-log.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: NotificationStatus) {
    return this.notificationsService.findAll(user.clinicId, status);
  }

  @Get('appointment/:appointmentId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  findByAppointment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.notificationsService.findByAppointment(user.clinicId, appointmentId);
  }

  @Post(':id/reply')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  reply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReplyNotificationDto,
  ) {
    // Endpoint autenticado simulando um webhook de resposta do
    // paciente (ver nota no service). Em produção, isso seria uma
    // rota pública validada por assinatura do provedor (Twilio/WhatsApp),
    // não por JWT de usuário da clínica.
    return this.notificationsService.registerReply(user.clinicId, id, dto.status);
  }

  @Post('process-pending')
  @Roles(UserRole.ADMIN)
  processPending() {
    // Roda sob demanda o mesmo processamento do cron — útil pra
    // testar/forçar o envio sem esperar o próximo minuto.
    return this.notificationsService.processPendingReminders();
  }
}
