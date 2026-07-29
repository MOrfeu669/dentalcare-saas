import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterClinicDto } from '../dto/register-clinic.dto';
import { RegisterStaffDto } from '../dto/register-staff.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register/clinic')
  registerClinic(@Body() dto: RegisterClinicDto) {
    return this.authService.registerClinic(dto);
  }

  @Public()
  @Post('register/staff')
  registerStaff(@Body() dto: RegisterStaffDto) {
    return this.authService.registerStaff(dto);
  }

  // TODO: POST /auth/forgot-password — dispara e-mail com link de redefinição
  // TODO: POST /auth/reset-password  — valida token e atualiza a senha
}
