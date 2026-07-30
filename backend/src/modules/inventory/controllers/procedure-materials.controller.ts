import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProcedureMaterialsService } from '../services/procedure-materials.service';
import { CreateProcedureMaterialDto } from '../dto/create-procedure-material.dto';
import { UpdateProcedureMaterialDto } from '../dto/update-procedure-material.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

// Rota vive sob /procedures de propósito — é conceitualmente "a receita
// deste procedimento", mesmo a entidade/serviço morando em Inventory
// (ver comentário na entidade). Endpoints simples, sem tocar no fluxo
// principal de Procedures nem de TreatmentPlans (item 3 do pedido).
@ApiTags('procedures')
@ApiBearerAuth()
@Controller('procedures/:procedureId/materials')
export class ProcedureMaterialsController {
  constructor(private readonly procedureMaterialsService: ProcedureMaterialsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  addToRecipe(
    @CurrentUser() user: AuthenticatedUser,
    @Param('procedureId') procedureId: string,
    @Body() dto: CreateProcedureMaterialDto,
  ) {
    return this.procedureMaterialsService.addToRecipe(user.clinicId, procedureId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  listByProcedure(@CurrentUser() user: AuthenticatedUser, @Param('procedureId') procedureId: string) {
    return this.procedureMaterialsService.listByProcedure(user.clinicId, procedureId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  updateQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('procedureId') procedureId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProcedureMaterialDto,
  ) {
    return this.procedureMaterialsService.updateQuantity(user.clinicId, procedureId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('procedureId') procedureId: string,
    @Param('id') id: string,
  ) {
    return this.procedureMaterialsService.remove(user.clinicId, procedureId, id);
  }
}
