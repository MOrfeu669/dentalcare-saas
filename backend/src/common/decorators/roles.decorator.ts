import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../interfaces/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Uso: @Roles(UserRole.ADMIN, UserRole.DENTIST)
 * Combinado com o RolesGuard, controla o "Perfil de acesso" por endpoint.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
