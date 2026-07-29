import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClinicsService } from '../services/clinics.service';
import { UpdateClinicDto } from '../dto/update-clinic.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('clinics')
@ApiBearerAuth()
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.clinicsService.findOne(user.clinicId);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  updateMine(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateClinicDto) {
    return this.clinicsService.update(user.clinicId, dto);
  }
}
