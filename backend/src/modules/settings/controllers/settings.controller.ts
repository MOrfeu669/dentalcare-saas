import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';
import { UpdateClinicSettingsDto } from '../dto/update-settings.dto';
import { SettingsService } from '../services/settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getSettings(user.clinicId);
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateClinicSettingsDto,
  ) {
    return this.settingsService.updateSettings(user.clinicId, dto);
  }

  @Delete()
  @Roles(UserRole.ADMIN)
  resetSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.resetSettings(user.clinicId);
  }
}
