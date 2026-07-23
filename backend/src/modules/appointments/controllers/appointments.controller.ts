import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from '../services/appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.clinicId, dto);
  }

  @Get('day')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  getDaySchedule(@CurrentUser() user: AuthenticatedUser, @Query('date') date: string) {
    return this.appointmentsService.getDaySchedule(user.clinicId, new Date(date));
  }

  @Patch(':id/reschedule')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  reschedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { startTime: string; endTime: string },
  ) {
    return this.appointmentsService.reschedule(
      user.clinicId,
      id,
      new Date(body.startTime),
      new Date(body.endTime),
    );
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.appointmentsService.cancel(user.clinicId, id, body.reason);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentsService.confirm(user.clinicId, id);
  }
}
