import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinancialService } from '../services/financial.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial/cash-flow')
export class CashFlowController {
  constructor(private readonly financialService: FinancialService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  getCashFlow(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.financialService.getCashFlow(user.clinicId, from, to);
  }
}
