import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { QueryAuditDto } from '../dto/query-audit.dto';
import { PaginatedResult, PaginationParams } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async logAction(params: {
    clinicId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    ip?: string;
    details?: string;
  }): Promise<AuditLog> {
    const entry = this.auditRepository.create(params as Partial<AuditLog>);
    return this.auditRepository.save(entry as AuditLog);
  }

  async findByClinic(
    clinicId: string,
    query: QueryAuditDto & PaginationParams,
  ): Promise<PaginatedResult<AuditLog>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Record<string, any> = { clinicId };

    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;

    const [data, total] = await this.auditRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findRecentByEntity(clinicId: string, entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { clinicId, entityType, entityId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
}
