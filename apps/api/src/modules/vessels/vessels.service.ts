import { PrismaService, Vessel, VesselDocument } from '@gbferry/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VesselsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(createDto: any, userId?: string): Promise<Vessel> {
    const vessel = await this.prisma.vessel.create({
      data: {
        ...createDto,
        status: createDto.status || 'ACTIVE',
      },
    });

    await this.auditService.log({
      action: 'VESSEL_CREATE',
      entityType: 'vessel',
      entityId: vessel.id,
      userId,
      details: { name: vessel.name, imoNumber: vessel.imoNumber },
      compliance: 'Vessel registration logged per BMA R102',
    });

    return vessel;
  }

  async findAll(): Promise<{ items: Vessel[]; total: number }> {
    const vessels = await this.prisma.vessel.findMany({
      orderBy: { name: 'asc' },
    });

    return {
      items: vessels,
      total: vessels.length,
    };
  }

  async findOne(id: string): Promise<any> {
    const vessel = await this.prisma.vessel.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });

    if (!vessel) {
      throw new NotFoundException(`Vessel with ID ${id} not found`);
    }

    // Calculate basic compliance status overview
    const complianceStatus = {
      safeManningCompliant: true, // Placeholder until safe manning logic integrated here
      documentsValid: (vessel as any).documents.length > 0,
      insuranceValid: (vessel as any).documents.some(
        (d: any) => d.type === 'INSURANCE_CERTIFICATE'
      ),
    };

    return {
      ...vessel,
      complianceStatus,
    };
  }

  async update(id: string, updateDto: any, userId?: string): Promise<Vessel> {
    const vessel = await this.prisma.vessel.update({
      where: { id },
      data: updateDto,
    });

    await this.auditService.log({
      action: 'VESSEL_UPDATE',
      entityType: 'vessel',
      entityId: vessel.id,
      userId,
      details: { updatedFields: Object.keys(updateDto) },
      compliance: 'Vessel record update audit trail',
    });

    return vessel;
  }

  async getDocuments(vesselId: string): Promise<{ vesselId: string; documents: VesselDocument[] }> {
    const documents = await this.prisma.vesselDocument.findMany({
      where: { vesselId },
      orderBy: { uploadedAt: 'desc' },
    });

    return {
      vesselId,
      documents,
    };
  }

  async uploadDocument(
    vesselId: string,
    documentDto: any,
    userId?: string
  ): Promise<VesselDocument> {
    const document = await this.prisma.vesselDocument.create({
      data: {
        ...documentDto,
        vesselId,
      },
    });

    await this.auditService.log({
      action: 'DOCUMENT_UPLOAD',
      entityType: 'vessel',
      entityId: vesselId,
      userId,
      details: { documentId: document.id, type: document.type },
      compliance: 'Vessel regulatory document upload logged',
    });

    return document;
  }
}
