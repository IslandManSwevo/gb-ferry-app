import { DocumentStatus, PrismaService, VesselDocument } from '@gbferry/database';
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

export interface DocumentSearchParams {
  vesselId?: string;
  type?: string;
  status?: DocumentStatus | string;
  q?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class DocumentQueryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async search(
    params: DocumentSearchParams,
    userId?: string
  ): Promise<{
    data: VesselDocument[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 25, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.vesselId && { vesselId: params.vesselId }),
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status as any }),
    };

    if (params.q) {
      const term = params.q.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { type: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.vesselDocument.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vesselDocument.count({ where }),
    ]);

    await this.auditService.log({
      action: 'DOCUMENT_LIST_READ',
      entityType: 'document',
      userId,
      details: { total, page, limit, vesselId: params.vesselId, type: params.type, q: params.q },
    });

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
