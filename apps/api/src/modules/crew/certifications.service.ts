import { Certification, CertificationType, PrismaService } from '@gbferry/database';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { VerificationService } from './verification.service';

export interface CertificationFilters {
  crewId?: string;
  type?: CertificationType;
  expiringWithinDays?: number;
}

export interface CreateCertificationDto {
  crewId: string;
  type: CertificationType;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  certificationNumber: string;
}

export interface ExpiringCertification {
  id: string;
  crewId: string;
  type: CertificationType;
  expiryDate: Date;
  daysUntilExpiry: number;
  severity: 'critical' | 'warning'; // critical: <7 days, warning: <30 days
}

@Injectable()
export class CertificationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private verificationService: VerificationService
  ) {}

  async create(createDto: CreateCertificationDto, userId?: string): Promise<Certification> {
    /**
     * COMPLIANCE GATE: STCW and BMA Certification Validation
     */

    if (!createDto.type) {
      throw new BadRequestException('Certification type is required');
    }

    if (!createDto.expiryDate) {
      throw new BadRequestException('Certification expiry date is required');
    }

    const now = new Date();
    if (new Date(createDto.expiryDate) <= now) {
      throw new BadRequestException('Certification expiry date must be in the future');
    }

    const validTypes = Object.values(CertificationType);
    if (!validTypes.includes(createDto.type)) {
      throw new BadRequestException(
        `Invalid certification type. Must be one of: ${validTypes.join(', ')}`
      );
    }

    const certification = await this.prisma.certification.create({
      data: {
        crew: { connect: { id: createDto.crewId } },
        type: createDto.type,
        issueDate: new Date(createDto.issueDate),
        expiryDate: new Date(createDto.expiryDate),
        issuingAuthority: createDto.issuingAuthority,
        issuingCountry: 'BS',
        certificateNumber: createDto.certificationNumber,
        status: 'VALID',
        createdBy: { connect: { id: userId || 'system' } },
      },
    });

    await this.auditService.log({
      action: 'CERTIFICATION_CREATE',
      entityId: certification.id,
      entityType: 'certification',
      userId,
      details: { type: createDto.type, crewId: createDto.crewId, expiryDate: createDto.expiryDate },
      compliance: 'STCW - Certification validated and recorded',
    });

    return certification;
  }

  async verify(id: string, userId?: string): Promise<Certification> {
    /**
     * COMPLIANCE GATE: Real-time External Verification
     * This method triggers an external check against the issuing authority's registry.
     */

    const certification = await this.prisma.certification.findUnique({
      where: { id },
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    const result = await this.verificationService.verifyCertification(certification);

    const updated = await this.prisma.certification.update({
      where: { id },
      data: {
        documentVerified: result.verified as boolean,
        status: result.status as any,
        verifiedAt: result.verificationDate,
        verifiedById: userId,
        notes: `External verification: ${JSON.stringify(result.authorityResponse)}`,
      },
    });

    await this.auditService.log({
      action: 'CERTIFICATION_VERIFY',
      entityId: id,
      entityType: 'certification',
      userId,
      details: result,
      compliance: `STCW - External verification completed with status: ${result.status}`,
    });

    return updated;
  }

  async verifyAllForCrew(crewId: string, userId?: string): Promise<void> {
    const certifications = await this.prisma.certification.findMany({
      where: { crewId, status: { not: 'REVOKED' } },
    });

    await Promise.allSettled(certifications.map((cert) => this.verify(cert.id, userId)));
  }

  async findAll(filters: CertificationFilters): Promise<{
    data: Certification[];
    total: number;
    filters: CertificationFilters;
  }> {
    if (filters.expiringWithinDays && filters.expiringWithinDays < 0) {
      throw new BadRequestException('expiringWithinDays must be a positive integer');
    }

    const certifications = await this.prisma.certification.findMany({
      where: {
        ...(filters.crewId && { crewId: filters.crewId }),
        ...(filters.type && { type: filters.type }),
        status: { not: 'REVOKED' },
      },
      include: {
        crew: {
          select: {
            id: true,
            familyName: true,
            givenNames: true,
            role: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return {
      data: certifications,
      total: certifications.length,
      filters,
    };
  }

  async getExpiring(withinDays: number = 30): Promise<ExpiringCertification[]> {
    if (withinDays < 1 || withinDays > 365) {
      throw new BadRequestException('withinDays must be between 1 and 365 days');
    }

    const now = new Date();
    const expiryDeadline = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    const expiring = await this.prisma.certification.findMany({
      where: {
        status: 'VALID',
        expiryDate: {
          lte: expiryDeadline,
          gt: now,
        },
      },
      include: {
        crew: {
          select: {
            id: true,
            familyName: true,
            givenNames: true,
            role: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return expiring.map((cert: Certification) => {
      const daysUntilExpiry = Math.floor(
        (cert.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      return {
        id: cert.id,
        crewId: cert.crewId,
        type: cert.type,
        expiryDate: cert.expiryDate,
        daysUntilExpiry,
        severity: (daysUntilExpiry < 7 ? 'critical' : 'warning') as 'critical' | 'warning',
      };
    });
  }

  async findOne(id: string): Promise<Certification> {
    const certification = await this.prisma.certification.findUnique({
      where: { id },
      include: { crew: true },
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    return certification;
  }

  async update(id: string, updateDto: any, userId?: string): Promise<Certification> {
    const certification = await this.prisma.certification.update({
      where: { id },
      data: updateDto,
    });

    await this.auditService.log({
      action: 'CERTIFICATION_UPDATE',
      entityId: id,
      entityType: 'certification',
      userId,
      details: updateDto,
    });

    return certification;
  }

  async revoke(id: string, reason: string, userId?: string): Promise<Certification> {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Revocation reason is required');
    }

    const revoked = await this.prisma.certification.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revocationReason: reason,
      } as any,
    });

    await this.auditService.log({
      action: 'CERTIFICATION_REVOKE',
      entityId: id,
      entityType: 'certification',
      userId,
      details: { reason },
      compliance: 'ISO 27001 A.8.15 - Immutable audit record of revocation',
    });

    return revoked;
  }
}
