import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
declare global {
    var prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export type { Prisma } from '@prisma/client';
export { PrismaClient };
export { AuditAction, CbpSubmissionStatus, CertificationStatus, CertificationType, CrewRole, CrewStatus, DocumentStatus, Gender, InspectionResult, InspectionStatus, InspectionType, VesselCertificateStatus, VesselCertificateType, VesselStatus, VesselType, } from '@prisma/client';
export type { AuditLog, BmaComplianceRecord, CbpSubmission, Certification, CrewMember, ExportHistory, I418CrewEntry, I418Submission, Inspection, InspectionDeficiency, MedicalCertificate, PlatformSetting, SafeManningRequirement, SafeManningRole, User, Vessel, VesselCertificate, VesselDocument, VesselOwner, } from '@prisma/client';
