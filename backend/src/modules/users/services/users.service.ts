import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(clinicId: string, dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      ...dto,
      clinicId,
      passwordHash,
    });
    return this.userRepository.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, relations: ['clinic'] });
  }

  async findByIdInClinic(id: string, clinicId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id, clinicId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  findAllInClinic(clinicId: string): Promise<User[]> {
    return this.userRepository.find({ where: { clinicId, active: true } });
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }
}
