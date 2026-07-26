import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProceduresService } from '../services/procedures.service';
import { CreateProcedureDto } from '../dto/create-procedure.dto';
import { UpdateProcedureDto } from '../dto/update-procedure.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('procedures')
@ApiBearerAuth()
@Controller('procedures')
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProcedureDto) {
    return this.proceduresService.create(user.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('includeInactive') includeInactive?: string) {
    return this.proceduresService.findAll(user.clinicId, includeInactive !== 'true');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.proceduresService.findOne(user.clinicId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProcedureDto,
  ) {
    return this.proceduresService.update(user.clinicId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.proceduresService.deactivate(user.clinicId, id);
  }
}
