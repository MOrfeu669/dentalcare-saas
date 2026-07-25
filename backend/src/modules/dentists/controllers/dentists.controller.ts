import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DentistsService } from '../services/dentists.service';
import { CreateDentistProfileDto } from '../dto/create-dentist-profile.dto';
import { UpdateDentistProfileDto } from '../dto/update-dentist-profile.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('dentists')
@ApiBearerAuth()
@Controller('dentists')
export class DentistsController {
  constructor(private readonly dentistsService: DentistsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDentistProfileDto) {
    return this.dentistsService.create(user.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.dentistsService.findAll(user.clinicId);
  }

  @Get(':userId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string) {
    return this.dentistsService.findByUserId(user.clinicId, userId);
  }

  @Patch(':userId')
  @Roles(UserRole.ADMIN)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateDentistProfileDto,
  ) {
    return this.dentistsService.update(user.clinicId, userId, dto);
  }
}
