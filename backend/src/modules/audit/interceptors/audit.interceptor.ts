import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    return next.handle().pipe(
      tap(async () => {
        if (!user) {
          return;
        }

        const method = req.method;
        const shouldAudit = ['POST', 'PATCH', 'DELETE'].includes(method);
        if (!shouldAudit) {
          return;
        }

        const controllerName = context.getClass().name;
        const handlerName = context.getHandler().name;
        const entityType = controllerName.replace(/Controller$/, '').toLowerCase();

        await this.auditService.logAction({
          clinicId: user.clinicId,
          userId: user.id,
          action: method.toLowerCase(),
          entityType,
          entityId: req.params?.id,
          before: req.body ? { body: req.body } : undefined,
          after: undefined,
          ip: req.ip,
          details: `${handlerName} via ${req.originalUrl}`,
        });
      }),
    );
  }
}
