import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';
import { QueryAuditDto } from '../dto/query-audit.dto';
import { AuditService } from '../services/audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryAuditDto) {
    return this.auditService.findByClinic(user.clinicId, query);
  }
}
