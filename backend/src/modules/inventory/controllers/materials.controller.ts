import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MaterialsService } from '../services/materials.service';
import { CreateMaterialDto } from '../dto/create-material.dto';
import { UpdateMaterialDto } from '../dto/update-material.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMaterialDto) {
    return this.materialsService.create(user.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('includeInactive') includeInactive?: string) {
    return this.materialsService.findAll(user.clinicId, includeInactive !== 'true');
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN)
  findLowStock(@CurrentUser() user: AuthenticatedUser) {
    return this.materialsService.findLowStock(user.clinicId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.materialsService.findOne(user.clinicId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(user.clinicId, id, dto);
  }
}
