import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClinicalNotesService } from '../services/clinical-notes.service';
import { CreateClinicalNoteDto } from '../dto/create-clinical-note.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records/notes')
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Post()
  @Roles(UserRole.DENTIST, UserRole.ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClinicalNoteDto) {
    // dentistId sempre vem do token, nunca do body — evita alguém
    // registrar evolução em nome de outro profissional
    return this.clinicalNotesService.create(user.clinicId, user.id, dto);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DENTIST)
  findByPatient(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.clinicalNotesService.findByPatient(user.clinicId, patientId);
  }
}
