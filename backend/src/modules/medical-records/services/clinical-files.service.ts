import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { ClinicalFile } from '../entities/clinical-file.entity';
import { UploadClinicalFileDto } from '../dto/upload-clinical-file.dto';

@Injectable()
export class ClinicalFilesService {
  constructor(
    @InjectRepository(ClinicalFile)
    private readonly clinicalFileRepository: Repository<ClinicalFile>,
    private readonly configService: ConfigService,
  ) {}

  async register(
    clinicId: string,
    uploadedBy: string,
    dto: UploadClinicalFileDto,
    file: Express.Multer.File,
  ): Promise<ClinicalFile> {
    const record = this.clinicalFileRepository.create({
      clinicId,
      patientId: dto.patientId,
      uploadedBy,
      type: dto.type,
      description: dto.description,
      originalName: file.originalname,
      storagePath: file.filename, // caminho relativo — resolvido contra STORAGE_LOCAL_PATH na leitura
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
    return this.clinicalFileRepository.save(record);
  }

  findByPatient(clinicId: string, patientId: string): Promise<ClinicalFile[]> {
    return this.clinicalFileRepository.find({
      where: { clinicId, patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<ClinicalFile> {
    const file = await this.clinicalFileRepository.findOne({ where: { id, clinicId } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');
    return file;
  }

  /** Caminho absoluto no disco — usado só internamente para servir o download. */
  resolveAbsolutePath(file: ClinicalFile): string {
    const basePath = this.configService.get<string>('app.storage.localPath', './uploads');
    return path.join(process.cwd(), basePath, file.storagePath);
  }

  async remove(clinicId: string, id: string): Promise<void> {
    const file = await this.findOne(clinicId, id);
    await this.clinicalFileRepository.softDelete({ id, clinicId });
    await fs.unlink(this.resolveAbsolutePath(file)).catch(() => {
      // Se o arquivo físico já não existir, não é um erro fatal — o
      // registro no banco é a fonte da verdade pra listagem.
    });
  }
}
