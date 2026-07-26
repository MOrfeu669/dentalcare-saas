import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StockMovement, StockMovementType } from '../entities/stock-movement.entity';
import { Material } from '../entities/material.entity';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Registra a movimentação E atualiza o saldo do material na mesma
   * transação — nunca deixa o histórico (stock_movements) e o saldo
   * consolidado (materials.current_stock) dessincronizarem.
   */
  async register(clinicId: string, dto: CreateStockMovementDto): Promise<StockMovement> {
    return this.dataSource.transaction(async (manager) => {
      const material = await manager.findOne(Material, { where: { id: dto.materialId, clinicId } });
      if (!material) throw new NotFoundException('Material não encontrado');

      const delta = dto.type === StockMovementType.IN ? Number(dto.quantity) : -Number(dto.quantity);
      const newStock = Number(material.currentStock) + delta;

      if (newStock < 0) {
        throw new BadRequestException(
          `Estoque insuficiente: saldo atual é ${material.currentStock} ${material.unit}.`,
        );
      }

      await manager.update(Material, { id: material.id }, { currentStock: newStock });

      const movement = manager.create(StockMovement, { ...dto, clinicId });
      const saved = await manager.save(movement);

      if (newStock <= Number(material.minStock)) {
        // Ninguém escuta ainda (NotificationsModule é stub) — mas o
        // gancho já fica pronto pro alerta de estoque baixo.
        this.eventEmitter.emit('inventory.low-stock', {
          clinicId,
          materialId: material.id,
          materialName: material.name,
          currentStock: newStock,
          minStock: material.minStock,
        });
      }

      return saved;
    });
  }

  findByMaterial(clinicId: string, materialId: string): Promise<StockMovement[]> {
    return this.stockMovementRepository.find({
      where: { clinicId, materialId },
      order: { createdAt: 'DESC' },
    });
  }
}
