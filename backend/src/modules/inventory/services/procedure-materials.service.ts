import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcedureMaterial } from '../entities/procedure-material.entity';
import { CreateProcedureMaterialDto } from '../dto/create-procedure-material.dto';
import { UpdateProcedureMaterialDto } from '../dto/update-procedure-material.dto';
import { MaterialsService } from './materials.service';
import { ProceduresService } from '../../procedures/services/procedures.service';

@Injectable()
export class ProcedureMaterialsService {
  constructor(
    @InjectRepository(ProcedureMaterial)
    private readonly procedureMaterialRepository: Repository<ProcedureMaterial>,
    private readonly materialsService: MaterialsService,
    private readonly proceduresService: ProceduresService,
  ) {}

  /**
   * Adiciona um material à receita de um procedimento. Valida (item 4
   * do pedido) que o procedimento e o material existem nesta clínica
   * antes de gravar — nunca aceita um materialId "solto".
   */
  async addToRecipe(
    clinicId: string,
    procedureId: string,
    dto: CreateProcedureMaterialDto,
  ): Promise<ProcedureMaterial> {
    await this.proceduresService.findOne(clinicId, procedureId); // 404 se não existir/não for desta clínica
    await this.materialsService.findOne(clinicId, dto.materialId); // idem pro material

    const existing = await this.procedureMaterialRepository.findOne({
      where: { clinicId, procedureId, materialId: dto.materialId },
    });
    if (existing) {
      throw new ConflictException(
        'Este material já está na receita deste procedimento — use PATCH para ajustar a quantidade.',
      );
    }

    const item = this.procedureMaterialRepository.create({
      clinicId,
      procedureId,
      materialId: dto.materialId,
      quantity: dto.quantity,
    });
    return this.procedureMaterialRepository.save(item);
  }

  async listByProcedure(clinicId: string, procedureId: string): Promise<ProcedureMaterial[]> {
    await this.proceduresService.findOne(clinicId, procedureId);
    return this.procedureMaterialRepository.find({
      where: { clinicId, procedureId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateQuantity(
    clinicId: string,
    procedureId: string,
    id: string,
    dto: UpdateProcedureMaterialDto,
  ): Promise<ProcedureMaterial> {
    const item = await this.findOneOrThrow(clinicId, procedureId, id);
    await this.procedureMaterialRepository.update({ id: item.id, clinicId }, { quantity: dto.quantity });
    return this.findOneOrThrow(clinicId, procedureId, id);
  }

  async remove(clinicId: string, procedureId: string, id: string): Promise<void> {
    const item = await this.findOneOrThrow(clinicId, procedureId, id);
    await this.procedureMaterialRepository.delete({ id: item.id, clinicId });
  }

  private async findOneOrThrow(clinicId: string, procedureId: string, id: string): Promise<ProcedureMaterial> {
    const item = await this.procedureMaterialRepository.findOne({ where: { id, clinicId, procedureId } });
    if (!item) throw new NotFoundException('Item da receita não encontrado');
    return item;
  }

  /**
   * Usado pelo ProcedureConsumptionService (listener do evento de
   * conclusão) — a receita inteira de um procedimento, sem validar
   * existência de novo (quem chama já sabe que o procedimento existe).
   */
  findRecipeItems(clinicId: string, procedureId: string): Promise<ProcedureMaterial[]> {
    return this.procedureMaterialRepository.find({ where: { clinicId, procedureId } });
  }
}
