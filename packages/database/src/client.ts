import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
};

export const prisma = global.prisma ?? new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * PrismaService - Injectable Prisma Client for NestJS
 * 
 * Extends PrismaClient to integrate with NestJS lifecycle hooks.
 * Automatically connects on module init and disconnects on destroy.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super(prismaClientOptions);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export type { Prisma } from '@prisma/client';
export { PrismaClient };

// Re-export generated types
    export type {
        AuditLog, Certification, CrewMember, ExportHistory, Inspection,
        InspectionDeficiency, Manifest,
        ManifestPassenger,
        ManifestValidationError, MedicalCertificate, Passenger, SafeManningRequirement,
        SafeManningRole, Sailing, User, Vessel, VesselDocument, VesselOwner
    } from '@prisma/client';

// Re-export enums
export {
    AuditAction, CertificationStatus, CrewRole,
    CrewStatus, DocumentStatus, Gender,
    IdentityDocType, InspectionResult, InspectionStatus, InspectionType, ManifestStatus, PassengerStatus, VesselStatus, VesselType
} from '@prisma/client';

