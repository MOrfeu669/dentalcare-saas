import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditService } from '../services/audit.service';
import { AuthenticatedUser } from '../../../common/interfaces/user-role.enum';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// Rotas que não valem auditar (login/registro são públicos e não têm
// usuário autenticado; o pró a auditar is mutations de dados de negócio).
const SKIP_PATHS = ['/auth/login', '/auth/register'];

/**
 * Aplicado globalmente via APP_INTERCEPTOR no AuditModule (@Global).
 * Captura automaticamente toda mutação bem-sucedida de dados de
 * negócio. Falhas (status >= 400) não são registradas como auditoria —
 * nada mudou de fato; o filtro de exceções já cobre o log de erros.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const path: string = req.path ?? '';

    const shouldAudit =
      AUDITED_METHODS.has(method) &&
      !SKIP_PATHS.some((p) => path.includes(p));

    if (!shouldAudit) return next.handle();

    const user = req.user as AuthenticatedUser | undefined;
    if (!user?.id || !user?.clinicId) return next.handle(); // rota pública ou sem contexto de tenant

    const action = this.deriveAction(method);
    const entityType = this.deriveEntityType(path);
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket?.remoteAddress
      ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          // Só grava depois que a resposta saiu com sucesso — se o
          // handler lançar exceção, o tap.error não registra nada.
          const entityId = this.extractEntityId(responseBody as Record<string, unknown>);

          this.auditService.logAction({
            clinicId: user.clinicId,
            userId: user.id,
            action,
            entityType,
            entityId,
            after: method !== 'DELETE'
              ? this.sanitize(responseBody as Record<string, unknown>)
              : undefined,
            ip,
            details: `${method} ${path}`,
          }).catch(() => {
            // Nunca deixa um erro de auditoria derrubar a requisição
            // principal — registra no console mas engole a exceção.
          });
        },
      }),
    );
  }

  private deriveAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'create',
      PATCH: 'update',
      PUT: 'update',
      DELETE: 'delete',
    };
    return map[method] ?? method.toLowerCase();
  }

  private deriveEntityType(path: string): string {
    // /api/v1/patients/123 → "patients"
    const segments = path.replace(/^\/api\/v1\//, '').split('/');
    return segments[0] ?? 'unknown';
  }

  private extractEntityId(body: Record<string, unknown> | unknown): string | undefined {
    if (typeof body === 'object' && body !== null && 'id' in body) {
      return (body as Record<string, unknown>)['id'] as string;
    }
    return undefined;
  }

  /** Remove campos sensíveis antes de gravar no log. */
  private sanitize(body: Record<string, unknown> | unknown): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const { passwordHash, password, ...rest } = body as Record<string, unknown>;
    void passwordHash;
    void password;
    return rest;
  }
}
