import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DentistProfile } from '../entities/dentist-profile.entity';
import { CreateDentistProfileDto } from '../dto/create-dentist-profile.dto';
import { UpdateDentistProfileDto } from '../dto/update-dentist-profile.dto';
import { UsersService } from '../../users/services/users.service';
import { UserRole } from '../../../common/interfaces/user-role.enum';

@Injectable()
export class DentistsService {
  constructor(
    @InjectRepository(DentistProfile)
    private readonly dentistProfileRepository: Repository<DentistProfile>,
    private readonly usersService: UsersService, // nunca acessa o repository de User direto
  ) {}

  async create(clinicId: string, dto: CreateDentistProfileDto): Promise<DentistProfile> {
    const user = await this.usersService.findByIdInClinic(dto.userId, clinicId);
    if (user.role !== UserRole.DENTIST) {
      throw new BadRequestException(
        'Este usuário não tem perfil de Dentista — verifique o cadastro em Users.',
      );
    }

    const existing = await this.dentistProfileRepository.findOne({
      where: { clinicId, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('Este dentista já possui um perfil profissional cadastrado.');
    }

    const profile = this.dentistProfileRepository.create({ ...dto, clinicId });
    return this.dentistProfileRepository.save(profile);
  }

  findAll(clinicId: string): Promise<DentistProfile[]> {
    return this.dentistProfileRepository.find({
      where: { clinicId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByUserId(clinicId: string, userId: string): Promise<DentistProfile> {
    const profile = await this.dentistProfileRepository.findOne({
      where: { clinicId, userId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Perfil de dentista não encontrado');
    return profile;
  }

  async update(
    clinicId: string,
    userId: string,
    dto: UpdateDentistProfileDto,
  ): Promise<DentistProfile> {
    await this.findByUserId(clinicId, userId); // garante que existe e pertence à clínica
    await this.dentistProfileRepository.update({ clinicId, userId }, dto);
    return this.findByUserId(clinicId, userId);
  }

  /**
   * Expediente do dentista no dia da semana informado. Usado pelo
   * AppointmentConflictCheckerService (agenda) para não sugerir/aceitar
   * horário fora do expediente — ainda não conectado, ver TODO em
   * appointments.module.ts.
   */
  async getWorkingHoursForDay(clinicId: string, userId: string, weekday: keyof DentistProfile['workingHours']) {
    const profile = await this.findByUserId(clinicId, userId);
    return profile.workingHours?.[weekday] ?? [];
  }
}
