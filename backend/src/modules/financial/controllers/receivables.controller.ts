import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinancialService } from '../services/financial.service';
import { CreateReceivableDto } from '../dto/create-receivable.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';
import { ReceivableStatus } from '../entities/receivable.entity';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial/receivables')
export class ReceivablesController {
  constructor(private readonly financialService: FinancialService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReceivableDto) {
    return this.financialService.createReceivable(user.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('patientId') patientId?: string,
    @Query('status') status?: ReceivableStatus,
  ) {
    return this.financialService.findReceivables(user.clinicId, { patientId, status });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.financialService.findReceivableOne(user.clinicId, id);
  }
}
