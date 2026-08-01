import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { ClinicsService } from '../../clinics/services/clinics.service';
import { User } from '../../users/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterClinicDto } from '../dto/register-clinic.dto';
import { RegisterStaffDto } from '../dto/register-staff.dto';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly clinicsService: ClinicsService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.active || !user.passwordHash || !user.email || !user.role) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    await this.usersService.touchLastLogin(user.id);
    return this.buildAuthResponse(user);
  }

  /**
   * Onboarding de uma nova clínica no SaaS — cria o tenant e o
   * primeiro usuário (sempre admin) numa única operação, e já
   * devolve o token de acesso (login automático logo após o cadastro).
   * Público (@Public() no controller) — é o ponto de entrada de
   * qualquer clínica nova na plataforma.
   */
  async registerClinic(dto: RegisterClinicDto) {
    const clinic = await this.clinicsService.create(dto.clinic);

    const user = await this.usersService.create(clinic.id, {
      name: dto.admin.name,
      email: dto.admin.email,
      password: dto.admin.password,
      role: UserRole.ADMIN,
    });

    const userWithClinic = await this.usersService.findByEmail(user.email);
    return this.buildAuthResponse(userWithClinic!);
  }

  /**
   * Dentista ou recepcionista se vinculando a uma clínica JÁ
   * existente, identificada pelo CNPJ.
   *
   * Nota de segurança: qualquer pessoa que souber o CNPJ da clínica
   * (informação pouco sigilosa — costuma estar em nota fiscal, site,
   * cartão de visita) consegue criar uma conta de dentista/funcionário
   * vinculada a ela. Isso é aceitável para um MVP/ambiente de
   * desenvolvimento, mas antes de produção o correto é trocar por um
   * fluxo de convite (o admin gera um link/código de uso único) ou
   * exigir aprovação do admin antes da conta ficar ativa.
   */
  async registerStaff(dto: RegisterStaffDto) {
    const clinic = await this.clinicsService.findByCnpj(dto.clinicCnpj);

    if (dto.role === UserRole.DENTIST && !dto.professionalLicense) {
      throw new BadRequestException('CRO é obrigatório para cadastro de dentista.');
    }

    const user = await this.usersService.create(clinic.id, {
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role,
      professionalLicense: dto.professionalLicense,
    });

    const userWithClinic = await this.usersService.findByEmail(user.email);
    return this.buildAuthResponse(userWithClinic!);
  }

  private buildAuthResponse(user: User) {
    const payload: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        clinicName: user.clinic?.name,
      },
    };
  }
}
