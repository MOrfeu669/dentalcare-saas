import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OdontogramService } from '../services/odontogram.service';
import { UpdateToothDto } from '../dto/update-tooth.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records/odontogram')
export class OdontogramController {
  constructor(private readonly odontogramService: OdontogramService) {}

  @Get(':patientId')
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  findByPatient(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.odontogramService.findByPatient(user.clinicId, patientId);
  }

  @Put(':patientId/teeth/:toothNumber')
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  updateTooth(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Param('toothNumber') toothNumber: string,
    @Body() dto: UpdateToothDto,
  ) {
    return this.odontogramService.updateTooth(user.clinicId, patientId, toothNumber, dto);
  }
}
