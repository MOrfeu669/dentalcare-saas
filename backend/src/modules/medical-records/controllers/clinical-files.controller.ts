import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ClinicalFilesService } from '../services/clinical-files.service';
import { UploadClinicalFileDto } from '../dto/upload-clinical-file.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

const STORAGE_PATH = process.env.STORAGE_LOCAL_PATH ?? './uploads';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records/files')
export class ClinicalFilesController {
  constructor(private readonly clinicalFilesService: ClinicalFilesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: STORAGE_PATH,
        // Nome gerado no servidor (nunca o nome original do cliente) —
        // evita path traversal e colisão de arquivos com o mesmo nome.
        filename: (_req, file, callback) => {
          const ext = path.extname(file.originalname);
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB — radiografia digital cabe tranquilo
    }),
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadClinicalFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.clinicalFilesService.register(user.clinicId, user.id, dto, file);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  findByPatient(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.clinicalFilesService.findByPatient(user.clinicId, patientId);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.DENTIST, UserRole.RECEPTIONIST)
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.clinicalFilesService.findOne(user.clinicId, id);
    // Sempre passa pelo NestJS autenticado — nunca um caminho público/estático,
    // já que são documentos clínicos sensíveis.
    res.download(this.clinicalFilesService.resolveAbsolutePath(file), file.originalName);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.clinicalFilesService.remove(user.clinicId, id);
  }
}
