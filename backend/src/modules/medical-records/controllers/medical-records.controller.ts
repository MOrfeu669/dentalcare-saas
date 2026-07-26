import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MedicalRecordsService } from '../services/medical-records.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('patient/:patientId/summary')
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  getFullHistory(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.medicalRecordsService.getFullHistory(user.clinicId, patientId);
  }
}
