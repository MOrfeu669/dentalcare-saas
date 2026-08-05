import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from '../services/appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
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

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  findInRange(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('dentistId') dentistId?: string,
  ) {
    return this.appointmentsService.findInRange(user.clinicId, new Date(from), new Date(to), dentistId);
  }

  @Get('day')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  getDaySchedule(@CurrentUser() user: AuthenticatedUser, @Query('date') date: string) {
    return this.appointmentsService.getDaySchedule(user.clinicId, new Date(date));
  }

  @Get('available-slots')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  getAvailableSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Query('dentistId') dentistId: string,
    @Query('date') date: string,
    @Query('durationMinutes') durationMinutes: string,
  ) {
    return this.appointmentsService.findAvailableSlots(
      user.clinicId,
      dentistId,
      new Date(date),
      parseInt(durationMinutes, 10) || 30,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user.clinicId, id, dto);
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

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentsService.complete(user.clinicId, id);
  }
}
