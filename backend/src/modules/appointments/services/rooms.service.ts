import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(clinicId: string, dto: CreateRoomDto): Promise<Room> {
    const existing = await this.roomRepository.findOne({ where: { clinicId, name: dto.name } });
    if (existing) {
      throw new ConflictException('Já existe uma sala com este nome nesta clínica');
    }
    const room = this.roomRepository.create({ ...dto, clinicId });
    return this.roomRepository.save(room);
  }

  findAll(clinicId: string, onlyActive = true): Promise<Room[]> {
    return this.roomRepository.find({
      where: onlyActive ? { clinicId, active: true } : { clinicId },
      order: { name: 'ASC' },
    });
  }

  async findOne(clinicId: string, id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { id, clinicId } });
    if (!room) throw new NotFoundException('Sala não encontrada');
    return room;
  }

  async update(clinicId: string, id: string, dto: UpdateRoomDto): Promise<Room> {
    await this.findOne(clinicId, id);
    await this.roomRepository.update({ id, clinicId }, dto);
    return this.findOne(clinicId, id);
  }

  /**
   * Não apaga a sala (ela pode estar referenciada em consultas
   * passadas — appointments.room_id) — apenas some da lista de
   * disponíveis para novos agendamentos.
   */
  async deactivate(clinicId: string, id: string): Promise<Room> {
    await this.findOne(clinicId, id);
    await this.roomRepository.update({ id, clinicId }, { active: false });
    return this.findOne(clinicId, id);
  }
}
