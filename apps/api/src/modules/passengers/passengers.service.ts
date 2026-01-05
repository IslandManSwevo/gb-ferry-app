import {
  validateDocumentNumber,
  validateMinimumAge,
  validatePassengerIMOFields,
  validatePassportExpiry,
} from '@/lib/validators';
import { PrismaService, decryptField, encryptField, maskField } from '@gbferry/database';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

// Define passenger create interface locally - aligned with Prisma schema enums
export interface PassengerCreateDTO {
  familyName: string;
  givenNames: string;
  dateOfBirth: Date | string;
  nationality: string;
  gender: 'M' | 'F' | 'X'; // Matches Prisma Gender enum
  identityDocType: 'PASSPORT' | 'NATIONAL_ID' | 'TRAVEL_DOCUMENT' | 'SEAMAN_BOOK'; // Matches Prisma IdentityDocType enum
  identityDocNumber: string;
  identityDocCountry: string;
  identityDocExpiry: Date | string;
  portOfEmbarkation: string;
  portOfDisembarkation: string;
  cabinOrSeat?: string;
  specialInstructions?: string;
  consentGiven: boolean;
  consentProvidedAt?: string;
}

export interface PassengerFilters {
  sailingId?: string;
  date?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class PassengersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  private readonly logger = new Logger(PassengersService.name);

  private encryptIdentityDocNumber(identityDocNumber: string): string {
    // Identity document number is required wherever this helper is called
    if (!identityDocNumber) {
      throw new Error('identityDocNumber is required for encryption');
    }
    return encryptField(identityDocNumber);
  }

  private maskIdentityDoc(ciphertext?: string | null): string | null {
    if (!ciphertext) return null;
    try {
      const plain = decryptField(ciphertext);
      return maskField(plain);
    } catch (err: any) {
      const message = err?.message || err?.stack || String(err);
      this.logger.warn(`Failed to decrypt identity document: ${message}`);
      return '****';
    }
  }

  /**
   * Check-in a passenger for a sailing
   *
   * Validation steps:
   * 1. Validate IMO FAL Form 5 required fields
   * 2. Validate passport expiry for sailing date
   * 3. Validate document format
   * 4. Check minimum age
   * 5. Verify consent
   * 6. Record audit trail
   */
  async checkIn(
    checkInDto: PassengerCreateDTO & { sailingId: string; sailingDate: string },
    userId?: string
  ): Promise<any> {
    // Step 1: IMO FAL Form 5 validation
    const imoErrors = validatePassengerIMOFields(checkInDto);
    if (imoErrors.length > 0) {
      throw new BadRequestException({
        message: 'Passenger data missing required fields',
        errors: imoErrors,
      });
    }

    // Step 2: Identity document expiry validation
    if (checkInDto.identityDocExpiry) {
      const sailingDate = new Date(checkInDto.sailingDate);
      const expiryDate =
        typeof checkInDto.identityDocExpiry === 'string'
          ? checkInDto.identityDocExpiry
          : checkInDto.identityDocExpiry.toISOString();
      const expiryError = validatePassportExpiry(expiryDate, sailingDate);
      if (expiryError) {
        throw new BadRequestException({
          message: 'Passenger document invalid for this sailing',
          error: expiryError,
        });
      }
    }

    // Step 3: Document format validation
    if (checkInDto.identityDocType && checkInDto.identityDocNumber) {
      const docError = validateDocumentNumber(
        checkInDto.identityDocType,
        checkInDto.identityDocNumber
      );
      if (docError) {
        throw new BadRequestException({
          message: 'Invalid document number format',
          error: docError,
        });
      }
    }

    // Step 4: Age validation
    if (checkInDto.dateOfBirth) {
      const dobString =
        typeof checkInDto.dateOfBirth === 'string'
          ? checkInDto.dateOfBirth
          : checkInDto.dateOfBirth.toISOString();
      const ageError = validateMinimumAge(dobString);
      if (ageError) {
        throw new BadRequestException({
          message: 'Passenger does not meet age requirements',
          error: ageError,
        });
      }
    }

    // Step 5: Consent verification
    if (!checkInDto.consentProvidedAt) {
      throw new BadRequestException('Passenger consent is required for maritime travel');
    }

    // Step 6 - Database insertion with Prisma
    const passenger = await this.prisma.passenger.create({
      data: {
        sailing: { connect: { id: checkInDto.sailingId } },
        familyName: checkInDto.familyName,
        givenNames: checkInDto.givenNames,
        dateOfBirth: new Date(checkInDto.dateOfBirth),
        nationality: checkInDto.nationality,
        gender: checkInDto.gender as any,
        identityDocType: checkInDto.identityDocType as any,
        identityDocNumber: this.encryptIdentityDocNumber(checkInDto.identityDocNumber),
        identityDocCountry: checkInDto.identityDocCountry,
        identityDocExpiry: new Date(checkInDto.identityDocExpiry),
        portOfEmbarkation: checkInDto.portOfEmbarkation,
        portOfDisembarkation: checkInDto.portOfDisembarkation,
        consentGiven: true,
        consentTimestamp: new Date(checkInDto.consentProvidedAt),
        status: 'CHECKED_IN',
        createdBy: { connect: { id: userId || 'system' } },
      },
    });

    // AUDIT LOGGING:
    await this.auditService.log({
      action: 'PASSENGER_CHECKIN',
      entityType: 'Passenger',
      entityId: passenger.id,
      userId,
      details: {
        sailingId: checkInDto.sailingId,
        name: `${checkInDto.familyName}, ${checkInDto.givenNames}`,
        validationsPassed: 5,
      },
      compliance: 'IMO FAL Form 5 - All 5-step validations passed',
    });

    return passenger;
  }

  /**
   * Find all passengers with optional filtering
   * ISO 27001 A.8.28: Input validation applied to all filter parameters
   */
  async findAll(filters: PassengerFilters, userId?: string): Promise<any> {
    // Validate filters
    if (
      filters.status &&
      !['CHECKED_IN', 'BOARDED', 'NO_SHOW', 'CANCELLED'].includes(filters.status)
    ) {
      throw new BadRequestException('Invalid status filter');
    }

    // Pagination with sensible defaults and caps
    const maxPageSize = 200;
    const parsedPage = Number(filters.page ?? 1);
    const parsedPageSize = Number(filters.pageSize ?? 100);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
    const pageSize =
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? Math.min(Math.floor(parsedPageSize), maxPageSize)
        : 100;
    const skip = (page - 1) * pageSize;

    const passengers = await this.prisma.passenger.findMany({
      where: {
        ...(filters.sailingId && { sailingId: filters.sailingId }),
        ...(filters.status && { status: filters.status as any }),
        ...(filters.date && {
          sailing: { departureTime: { gte: new Date(filters.date) } },
        }),
        deletedAt: null,
      } as any,
      include: { sailing: true },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
    });

    const sanitized = passengers.map((p: any) => ({
      ...p,
      identityDocNumber: this.maskIdentityDoc(p.identityDocNumber),
    }));

    // Log query for audit trail (ISO 27001 A.8.15)
    await this.auditService.log({
      action: 'PASSENGER_LIST_READ',
      entityType: 'Passenger',
      userId,
      details: { filters, resultCount: passengers.length },
      compliance: 'Read access to passenger PII logged',
    });

    return {
      data: sanitized,
      total: passengers.length,
      filters: { ...filters, page, pageSize },
      page,
      pageSize,
    };
  }

  /**
   * Get a single passenger record
   * Note: PII fields are masked in responses to prevent unauthorized exposure (ISO 27001 A.8.23)
   */
  async findOne(id: string, userId?: string): Promise<any> {
    const passenger = await this.prisma.passenger.findUnique({
      where: { id },
      include: {
        sailing: true,
        manifestEntries: { include: { manifest: true } },
      },
    });

    if (!passenger) {
      throw new NotFoundException(`Passenger ${id} not found`);
    }

    // Mask PII fields before returning
    const masked = {
      ...passenger,
      identityDocNumber: this.maskIdentityDoc(passenger.identityDocNumber),
    };

    // Log access for audit trail
    await this.auditService.log({
      action: 'PASSENGER_READ',
      entityType: 'Passenger',
      entityId: id,
      userId,
      compliance: 'ISO 27001 A.8.23 - Individual PII access logged',
    });

    return masked;
  }

  /**
   * Update passenger record
   * Immutably logged for audit compliance (ISO 27001 A.8.15)
   *
   * RESTRICTION: Cannot modify passengers in approved manifests
   */
  async update(id: string, updateDto: Partial<PassengerCreateDTO>, userId?: string): Promise<any> {
    const passenger = await this.prisma.passenger.findUnique({
      where: { id },
      include: { manifestEntries: { include: { manifest: true } } },
    });

    if (!passenger) {
      throw new NotFoundException(`Passenger ${id} not found`);
    }

    // Check if passenger is in approved/submitted manifest - if so, immutable
    if (
      passenger.manifestEntries?.some(
        (m) => m.manifest.status === 'APPROVED' || m.manifest.status === 'SUBMITTED'
      )
    ) {
      throw new BadRequestException(
        'Cannot modify passenger that is part of an approved or submitted manifest'
      );
    }

    const data: any = {};
    const assignIfPresent = <K extends keyof PassengerCreateDTO>(
      key: K,
      transform?: (value: any) => any
    ) => {
      if (updateDto[key] !== undefined) {
        data[key] = transform ? transform(updateDto[key]) : updateDto[key];
      }
    };

    assignIfPresent('familyName');
    assignIfPresent('givenNames');
    assignIfPresent('dateOfBirth', (value) => new Date(value as any));
    assignIfPresent('nationality');
    assignIfPresent('gender');
    assignIfPresent('identityDocType');
    assignIfPresent('identityDocNumber', (value) => this.encryptIdentityDocNumber(value as any));
    assignIfPresent('identityDocCountry');
    assignIfPresent('identityDocExpiry', (value) => new Date(value as any));
    assignIfPresent('portOfEmbarkation');
    assignIfPresent('portOfDisembarkation');
    assignIfPresent('cabinOrSeat');
    assignIfPresent('specialInstructions');
    assignIfPresent('consentGiven');
    assignIfPresent('consentProvidedAt', (value) => value);

    const updatedPassenger = await this.prisma.passenger.update({
      where: { id },
      data,
    });

    const maskedUpdatedPassenger = {
      ...updatedPassenger,
      identityDocNumber: this.maskIdentityDoc(updatedPassenger.identityDocNumber),
    };

    // Log audit trail with before/after values (immutable)
    await this.auditService.log({
      action: 'PASSENGER_UPDATE',
      entityType: 'Passenger',
      entityId: id,
      userId,
      details: {
        previousValue: passenger,
        newValue: maskedUpdatedPassenger,
      },
      compliance: 'ISO 27001 A.8.15 - Immutable audit log of all changes',
    });

    return maskedUpdatedPassenger;
  }

  /**
   * Soft delete - passenger records cannot be permanently deleted due to regulatory requirements
   * ISO 27001 A.8.29: Retention of records for compliance
   */
  async remove(id: string, userId?: string): Promise<any> {
    const passenger = await this.prisma.passenger.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        deletedAt: new Date(),
      } as any,
    });

    // Log audit trail
    await this.auditService.log({
      action: 'PASSENGER_DELETE',
      entityType: 'Passenger',
      entityId: id,
      userId,
      compliance: 'Soft delete - record retained for regulatory audit per ISO 27001 A.8.29',
    });

    return passenger;
  }
}
