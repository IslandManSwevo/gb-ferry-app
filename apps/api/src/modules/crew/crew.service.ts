import { validateCrewCompliance, validateSafeManningRequirement } from '@/lib/crew-validators';
import {
  CrewMember,
  decryptField,
  encryptField,
  maskField,
  Prisma,
  PrismaService,
} from '@gbferry/database';
import { CreateCrewMember, CrewRole } from '@gbferry/dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

// Define focused types using Prisma payloads to eliminate 'any'
type CrewMemberWithCerts = Prisma.CrewMemberGetPayload<{
  include: {
    certifications: { where: { status: 'VALID' } };
    medicalCertificate: true;
  };
}>;

export interface CrewFilters {
  vesselId?: string;
  role?: CrewRole;
  status?: string;
}

export interface SafeManningStatus {
  compliant: boolean;
  required: Record<string, number>;
  actualByRole: Record<string, number>;
  fulfillableByRole: Record<string, number>;
  discrepancies: string[];
}

@Injectable()
export class CrewService {
  private readonly logger = new Logger(CrewService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  private encryptValue(value?: string): string | undefined {
    if (!value) return undefined;
    return encryptField(value);
  }

  private maskCiphertext(value?: string | null, contextField?: string): string | null {
    if (!value) return null;
    try {
      const plain = decryptField(value);
      return maskField(plain);
    } catch (err: any) {
      this.logger.warn(
        `Failed to decrypt ciphertext${contextField ? ` for ${contextField}` : ''}: ${err.message}`
      );
      return maskField(value);
    }
  }

  async create(createDto: CreateCrewMember, userId: string): Promise<CrewMember> {
    /**
     * ISO 27001 A.8.23: PII Protection
     * Sensitive fields (Passport, ID) are encrypted at rest.
     */
    const crew = await this.prisma.crewMember.create({
      data: {
        familyName: createDto.familyName,
        givenNames: createDto.givenNames,
        dateOfBirth: new Date(createDto.dateOfBirth),
        nationality: createDto.nationality,
        gender: createDto.gender as any,
        passportNumber: this.encryptValue(createDto.passportNumber) as any,
        passportCountry: createDto.passportIssuingCountry,
        passportExpiry: new Date(createDto.passportExpiryDate),
        identificationNumber: this.encryptValue(
          createDto.seamanBookNumber || createDto.passportNumber
        ),
        role: createDto.role as any,
        ...(createDto.vesselId && { vessel: { connect: { id: createDto.vesselId } } }),
        status: 'ACTIVE' as any,
        createdById: userId,
      } as any,
    });

    await this.auditService.log({
      action: 'CREW_CREATE',
      entityId: crew.id,
      entityType: 'crew',
      userId,
      details: { role: createDto.role, vesselId: createDto.vesselId },
      compliance: 'BMA R106 - Crew member created and assigned',
    });

    return crew;
  }

  async findAll(filters: CrewFilters, userId?: string): Promise<{ data: any[]; total: number }> {
    const crewMembers = (await this.prisma.crewMember.findMany({
      where: {
        ...(filters.vesselId && { vesselId: filters.vesselId }),
        ...(filters.role && { role: filters.role as any }),
        status: (filters.status || 'ACTIVE') as any,
        deletedAt: null,
      },
      include: {
        certifications: { where: { status: 'VALID' } },
        medicalCertificate: true,
      },
    })) as CrewMemberWithCerts[];

    const maskedData = crewMembers.map((member) => ({
      ...member,
      identificationNumber: this.maskCiphertext(
        member.identificationNumber,
        'identificationNumber'
      ),
      passportNumber: this.maskCiphertext(member.passportNumber, 'passportNumber'),
    }));

    await this.auditService.log({
      action: 'CREW_LIST_READ',
      entityType: 'crew',
      userId,
      details: { filters, resultCount: crewMembers.length },
      compliance: 'Crew roster access logged',
    });

    return {
      data: maskedData,
      total: crewMembers.length,
    };
  }

  async findOne(id: string, userId?: string): Promise<any> {
    const crew = (await this.prisma.crewMember.findUnique({
      where: { id },
      include: {
        certifications: { orderBy: { expiryDate: 'asc' } },
        medicalCertificate: true,
      },
    })) as CrewMemberWithCerts | null;

    if (!crew) {
      throw new NotFoundException('Crew member not found');
    }

    await this.auditService.log({
      action: 'CREW_READ',
      entityId: id,
      entityType: 'crew',
      userId,
      compliance: 'ISO 27001 A.8.23 - Crew PII access logged',
    });

    return {
      ...crew,
      identificationNumber: this.maskCiphertext(crew.identificationNumber, 'identificationNumber'),
      passportNumber: this.maskCiphertext(crew.passportNumber, 'passportNumber'),
    };
  }

  async getRoster(vesselId: string, userId?: string): Promise<SafeManningStatus> {
    /**
     * Optimized Roster Validation
     * Single query with includes to avoid N+1 issues.
     */
    const vessel = await this.prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        crewMembers: {
          where: { deletedAt: null },
          include: {
            certifications: { where: { status: 'VALID' } },
            medicalCertificate: true,
          },
        },
        safeManningReqs: {
          include: { requirements: true },
          orderBy: { issueDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!vessel) throw new NotFoundException('Vessel not found');

    const crewMembers = vessel.crewMembers as CrewMemberWithCerts[];
    const safeManning = vessel.safeManningReqs[0];

    // Map data for shared rules engine
    const crewForValidation = crewMembers.map((c) => ({
      id: c.id,
      name: `${c.familyName} ${c.givenNames}`,
      role: c.role as any,
      hasMedical: !!c.medicalCertificate,
      medicalExpiryDate: c.medicalCertificate?.expiryDate.toISOString(),
      certifications: c.certifications.map((cert) => ({
        type: cert.type,
        expiryDate: cert.expiryDate.toISOString(),
      })),
    }));

    const stcwValidation = validateCrewCompliance(crewForValidation);

    const requirements = safeManning?.requirements.map((req: any) => ({
      role: req.role,
      minimumCount: req.minimumCount,
    }));

    const safeManningValidation = validateSafeManningRequirement(crewForValidation, {
      requirements,
      vesselGrossTonnage: Number(vessel.grossTonnage),
    });

    await this.auditService.log({
      action: 'CREW_ROSTER_READ',
      entityType: 'crew',
      userId,
      details: {
        vesselId,
        compliant: stcwValidation.compliant && safeManningValidation.compliant,
      },
      compliance: 'BMA R106 - Safe manning validation logged',
    });

    return {
      compliant: stcwValidation.compliant && safeManningValidation.compliant,
      required: safeManningValidation.required,
      actualByRole: safeManningValidation.actualByRole,
      fulfillableByRole: safeManningValidation.fulfillableByRole,
      discrepancies: [
        ...stcwValidation.errors.map((e) => e.message),
        ...safeManningValidation.errors.map((e) => e.message),
      ],
    };
  }

  async update(id: string, updateDto: any, userId?: string): Promise<CrewMember> {
    const data = { ...updateDto };

    if (updateDto.identificationNumber) {
      data.identificationNumber = this.encryptValue(updateDto.identificationNumber);
    }
    if (updateDto.passportNumber) {
      data.passportNumber = this.encryptValue(updateDto.passportNumber);
    }

    const updated = await this.prisma.crewMember.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      action: 'CREW_UPDATE',
      entityId: id,
      entityType: 'crew',
      userId,
      details: updateDto,
      compliance: 'ISO 27001 A.8.15 - Crew record updated',
    });

    return updated;
  }

  async remove(id: string, userId?: string): Promise<CrewMember> {
    // Soft delete to maintain regulatory audit history
    const deleted = await this.prisma.crewMember.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });

    await this.auditService.log({
      action: 'CREW_DELETE',
      entityId: id,
      entityType: 'crew',
      userId,
      compliance: 'Regulatory Record Retention - Soft delete performed',
    });

    return deleted;
  }
}
