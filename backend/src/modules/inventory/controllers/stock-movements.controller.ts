import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StockMovementsService } from '../services/stock-movements.service';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory/movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStockMovementDto) {
    return this.stockMovementsService.register(user.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  findByMaterial(@CurrentUser() user: AuthenticatedUser, @Query('materialId') materialId: string) {
    return this.stockMovementsService.findByMaterial(user.clinicId, materialId);
  }
}
