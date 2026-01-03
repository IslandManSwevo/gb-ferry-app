import { validateCrewCompliance, validateSafeManningRequirement } from '@/lib/crew-validators';
import { PrismaService } from '@gbferry/database';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

export interface CrewFilters {
  vesselId?: string;
  role?: string;
  certStatus?: string;
}

export interface CreateCrewDto {
  firstName: string;
  lastName: string;
  identificationNumber: string;
  nationality: string;
  role: string;
  vesselId: string;
  // ISO 27001 A.8.23: PII Protection - encrypted in database
}

export interface SafeManningStatus {
  compliant: boolean;
  required: Record<string, number>;
  actual: Record<string, number>;
  discrepancies: string[];
}

@Injectable()
export class CrewService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createDto: CreateCrewDto, userId?: string): Promise<any> {
    // Validate crew data structure
    if (!createDto.firstName || !createDto.lastName) {
      throw new BadRequestException('Crew member must have first and last name');
    }

    if (!createDto.identificationNumber) {
      throw new BadRequestException('Crew member must have identification number (Seafarer Book or STCW ID)');
    }

    if (!createDto.role) {
      throw new BadRequestException('Crew member must have assigned role');
    }

    // Create crew member
    const crew = await this.prisma.crewMember.create({
      data: {
        familyName: createDto.lastName,
        givenNames: createDto.firstName,
        dateOfBirth: new Date(), // TODO: Add to DTO
        nationality: createDto.nationality,
        gender: 'M', // TODO: Add to DTO
        passportNumber: createDto.identificationNumber, // Encrypted at DB level
        passportCountry: createDto.nationality,
        passportExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // TODO: Add to DTO
        identificationNumber: createDto.identificationNumber, // AES-256-GCM encrypted
        role: createDto.role as any, // Cast to enum
        vessel: createDto.vesselId ? { connect: { id: createDto.vesselId } } : undefined,
        status: 'ACTIVE',
        createdBy: { connect: { id: userId || 'system' } },
      } as any,
    });

    // Log audit trail via AuditService
    await this.auditService.log({
      action: 'CREW_CREATE',
      entityId: crew.id,
      entityType: 'crew',
      userId,
      details: { role: createDto.role, vesselId: createDto.vesselId },
      compliance: 'BMA R106 - Crew assignment recorded',
    });

    return crew;
  }

  async findAll(filters: CrewFilters, userId?: string): Promise<any> {
    const crew = await this.prisma.crewMember.findMany({
      where: {
        ...(filters.vesselId && { vesselId: filters.vesselId }),
        ...(filters.role && { role: filters.role as any }),
        deletedAt: null,
      } as any,
      include: {
        certifications: { where: { status: 'VALID' } },
      },
    });

    await this.auditService.log({
      action: 'CREW_LIST_READ',
      entityType: 'crew',
      userId,
      details: { filters, resultCount: crew.length },
      compliance: 'Crew list access logged',
    });

    return {
      data: crew,
      total: crew.length,
      filters,
    };
  }

  async assignCrewToVessel(crewId: string, vesselId: string, vesselGrossTonnage: number, userId?: string): Promise<any> {
    /**
     * COMPLIANCE GATE: BMA R106 Safe Manning Document Validation
     * Before assigning crew to vessel, validate that the assignment maintains
     * required safe manning levels for the vessel's tonnage category.
     */

    // Fetch current crew roster for vessel
    const currentRoster = await this.prisma.crewMember.findMany({
      where: { vesselId, deletedAt: null } as any,
      include: { certifications: { where: { status: 'VALID' } } },
    });

    // Fetch crew being assigned
    const crewMember = await this.prisma.crewMember.findUnique({
      where: { id: crewId },
      include: { certifications: { where: { status: 'VALID' } } },
    });

    if (!crewMember) {
      throw new BadRequestException('Crew member not found');
    }

    // Validate safe manning requirement
    const crewForValidation = [...currentRoster, crewMember].map(c => ({
      id: c.id,
      name: `${c.familyName} ${c.givenNames}`,
      role: c.role,
    }));
    const safeManningValidation = validateSafeManningRequirement(
      vesselGrossTonnage,
      crewForValidation,
    );

    if (!safeManningValidation.compliant) {
      throw new BadRequestException({
        message: 'Crew assignment violates BMA R106 Safe Manning requirements',
        discrepancies: safeManningValidation.errors,
      });
    }

    // Update crew assignment
    const updated = await this.prisma.crewMember.update({
      where: { id: crewId },
      data: { vesselId },
    });

    // Log audit trail
    await this.auditService.log({
      action: 'CREW_ASSIGN_VESSEL',
      entityId: crewId,
      entityType: 'crew',
      userId,
      details: { vesselId, validationPassed: true, rosterSize: currentRoster.length + 1 },
      compliance: 'BMA R106 - Safe manning requirement validated before assignment',
    });

    return updated;
  }

  async getRoster(vesselId: string, userId?: string): Promise<SafeManningStatus> {
    /**
     * Retrieves crew roster for vessel and validates against BMA R106
     * Safe Manning Document requirements.
     * 
     * Returns compliance status and any discrepancies that would prevent sailing.
     * Part of ISO 27001 A.8.28 (Input Validation) - all crew data validated before use.
     */

    const vessel = await this.prisma.vessel.findUnique({
      where: { id: vesselId },
    });

    if (!vessel) {
      throw new BadRequestException('Vessel not found');
    }

    const crew = await this.prisma.crewMember.findMany({
      where: { vesselId, deletedAt: null } as any,
      include: {
        certifications: {
          where: { status: 'VALID' },
        },
      },
    });

    // Validate safe manning requirement
    const crewForValidation = crew.map((c: any) => ({
      id: c.id,
      name: `${c.familyName} ${c.givenNames}`,
      role: c.role,
      hasMedical: false, // TODO: Check medical certificate
      certifications: (c.certifications || []).map((cert: any) => ({
        type: cert.type,
        expiryDate: cert.expiryDate.toISOString(),
      })),
    }));
    const validation = validateCrewCompliance(crewForValidation);

    // Log access
    await this.auditService.log({
      action: 'CREW_ROSTER_READ',
      entityType: 'crew',
      userId,
      details: { vesselId, crewCount: crew.length, compliant: validation.compliant },
      compliance: 'BMA R106 - Roster access and validation logged',
    });

    return {
      compliant: validation.compliant,
      required: {},
      actual: {},
      discrepancies: validation.errors.map(e => e.message),
    };
  }

  async findOne(id: string, userId?: string): Promise<any> {
    const crew = await this.prisma.crewMember.findUnique({
      where: { id },
      include: {
        certifications: {
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!crew) {
      throw new BadRequestException('Crew member not found');
    }

    // Log access
    await this.auditService.log({
      action: 'CREW_READ',
      entityId: id,
      entityType: 'crew',
      userId,
      compliance: 'ISO 27001 A.8.23 - Crew member PII access logged',
    });

    // ISO 27001 A.8.23: PII Protection
    // Mask sensitive fields before returning:
    const crewAny = crew as any;
    const maskedIdNumber = crewAny.identificationNumber
      ? crewAny.identificationNumber.slice(-4).padStart(crewAny.identificationNumber.length, '*')
      : null;
    const maskedPassport = crew.passportNumber.slice(-4).padStart(crew.passportNumber.length, '*');
    
    return {
      ...crew,
      identificationNumber: maskedIdNumber,
      passportNumber: maskedPassport,
    };
  }

  async update(id: string, updateDto: any, userId?: string): Promise<any> {
    const crew = await this.prisma.crewMember.update({
      where: { id },
      data: updateDto,
    });

    // Log audit trail via AuditService
    await this.auditService.log({
      action: 'CREW_UPDATE',
      entityId: id,
      entityType: 'crew',
      userId,
      details: updateDto,
      compliance: 'ISO 27001 A.8.15 - Crew update logged',
    });

    return crew;
  }

  async remove(id: string, userId?: string): Promise<any> {
    // Soft delete (regulatory requirement to retain crew records)
    const crew = await this.prisma.crewMember.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        status: 'INACTIVE',
      } as any,
    });

    // Log audit trail
    await this.auditService.log({
      action: 'CREW_DELETE',
      entityId: id,
      entityType: 'crew',
      userId,
      compliance: 'Soft delete - record retained for regulatory audit',
    });

    return crew;
  }
}
