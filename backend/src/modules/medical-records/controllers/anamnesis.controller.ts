import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnamnesisService } from '../services/anamnesis.service';
import { UpsertAnamnesisDto } from '../dto/upsert-anamnesis.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records/anamnesis')
export class AnamnesisController {
  constructor(private readonly anamnesisService: AnamnesisService) {}

  @Get(':patientId')
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  findByPatient(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.anamnesisService.findByPatient(user.clinicId, patientId);
  }

  @Put(':patientId')
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Body() dto: UpsertAnamnesisDto,
  ) {
    return this.anamnesisService.upsert(user.clinicId, patientId, user.id, dto);
  }
}
