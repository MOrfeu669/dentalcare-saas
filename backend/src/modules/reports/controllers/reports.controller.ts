import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

// TODO: exportação para PDF/Excel — adicionar `?format=pdf|xlsx` em
// cada endpoint abaixo, usando pdfkit/exceljs pra serializar o mesmo
// JSON já retornado hoje. A lógica de agregação (ReportsService) não
// muda nada; é só uma camada de serialização por cima.

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('financial')
  financial(@CurrentUser() user: AuthenticatedUser, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.financialReport(user.clinicId, new Date(from), new Date(to));
  }

  @Get('agenda')
  agenda(@CurrentUser() user: AuthenticatedUser, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.agendaReport(user.clinicId, new Date(from), new Date(to));
  }

  @Get('inventory')
  inventory(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.inventoryReport(user.clinicId);
  }

  @Get('patients')
  patients(@CurrentUser() user: AuthenticatedUser, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.patientsReport(user.clinicId, new Date(from), new Date(to));
  }

  @Get('procedures')
  procedures(@CurrentUser() user: AuthenticatedUser, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.proceduresReport(user.clinicId, new Date(from), new Date(to));
  }
}
