import { Module, Global } from '@nestjs/common';

/**
 * Auditoria: logins, alterações, exclusões, ações dos usuários.
 * Marcado @Global para que o AuditInterceptor possa ser usado por
 * qualquer módulo sem precisar reimportar AuditModule toda vez.
 */
@Global()
@Module({})
export class AuditModule {}

// TODO: entities/audit-log.entity.ts (userId, clinicId, action, entityType, entityId, before jsonb, after jsonb, ip)
// TODO: common/interceptors/audit.interceptor.ts -> registra automaticamente POST/PATCH/DELETE
