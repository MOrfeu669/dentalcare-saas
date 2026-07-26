import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../entities/material.entity';
import { CreateMaterialDto } from '../dto/create-material.dto';
import { UpdateMaterialDto } from '../dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async create(clinicId: string, dto: CreateMaterialDto): Promise<Material> {
    const existing = await this.materialRepository.findOne({ where: { clinicId, name: dto.name } });
    if (existing) {
      throw new ConflictException('Já existe um material com este nome nesta clínica');
    }
    const material = this.materialRepository.create({ ...dto, clinicId });
    return this.materialRepository.save(material);
  }

  findAll(clinicId: string, onlyActive = true): Promise<Material[]> {
    return this.materialRepository.find({
      where: onlyActive ? { clinicId, active: true } : { clinicId },
      order: { name: 'ASC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<Material> {
    const material = await this.materialRepository.findOne({ where: { id, clinicId } });
    if (!material) throw new NotFoundException('Material não encontrado');
    return material;
  }

  async update(clinicId: string, id: string, dto: UpdateMaterialDto): Promise<Material> {
    await this.findOne(clinicId, id);
    await this.materialRepository.update({ id, clinicId }, dto);
    return this.findOne(clinicId, id);
  }

  /** Estoque baixo = estoque atual menor ou igual ao mínimo definido. */
  findLowStock(clinicId: string): Promise<Material[]> {
    return this.materialRepository
      .createQueryBuilder('material')
      .where('material.clinic_id = :clinicId', { clinicId })
      .andWhere('material.active = true')
      .andWhere('material.current_stock <= material.min_stock')
      .orderBy('material.name', 'ASC')
      .getMany();
  }
}
