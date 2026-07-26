import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinancialService } from '../services/financial.service';
import { CreatePayableDto } from '../dto/create-payable.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';
import { PayableStatus } from '../entities/payable.entity';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial/payables')
export class PayablesController {
  constructor(private readonly financialService: FinancialService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePayableDto) {
    return this.financialService.createPayable(user.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: PayableStatus) {
    return this.financialService.findPayables(user.clinicId, status);
  }

  @Patch(':id/pay')
  @Roles(UserRole.ADMIN)
  markPaid(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.financialService.markPayablePaid(user.clinicId, id);
  }
}
