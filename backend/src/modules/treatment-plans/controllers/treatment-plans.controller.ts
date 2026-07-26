import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TreatmentPlansService } from '../services/treatment-plans.service';
import { CreateTreatmentPlanDto } from '../dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanStatusDto } from '../dto/update-treatment-plan-status.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('treatment-plans')
@ApiBearerAuth()
@Controller('treatment-plans')
export class TreatmentPlansController {
  constructor(private readonly treatmentPlansService: TreatmentPlansService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTreatmentPlanDto) {
    return this.treatmentPlansService.create(user.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string) {
    return this.treatmentPlansService.findAll(user.clinicId, patientId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.treatmentPlansService.findOne(user.clinicId, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentPlanStatusDto,
  ) {
    return this.treatmentPlansService.updateStatus(user.clinicId, id, dto.status);
  }

  @Patch(':id/items/:itemId/complete')
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  completeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.treatmentPlansService.completeItem(user.clinicId, id, itemId);
  }
}
