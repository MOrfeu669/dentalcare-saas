import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser, UserRole } from '../../../common/interfaces/user-role.enum';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN) // só o admin da clínica cria novos funcionários
  create(@CurrentUser() currentUser: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(currentUser.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findAllInClinic(currentUser.clinicId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.findByIdInClinic(id, currentUser.clinicId);
  }
}
