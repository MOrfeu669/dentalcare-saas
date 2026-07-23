import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/user-role.enum';

/**
 * Uso: findAll(@CurrentUser() user: AuthenticatedUser)
 * Evita repetir `req.user` em cada controller e deixa explícito que
 * toda operação de negócio depende do usuário (e da clínica) logado.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    return data ? user?.[data] : user;
  },
);
