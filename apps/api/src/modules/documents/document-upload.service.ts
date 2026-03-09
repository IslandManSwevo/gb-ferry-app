import {
  Certification,
  DocumentStatus,
  MedicalCertificate,
  PrismaService,
  VesselDocument,
} from '@gbferry/database';
import { DocumentMetadata, DocumentUploadDto } from '@gbferry/dto';
import { BadRequestException, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AIExtractionService } from './ai-extraction.service';

export interface StorageOptions {
  bucket: string;
  key: string;
}

export interface StorageService {
  uploadFile(file: Express.Multer.File, options: StorageOptions): Promise<string>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

@Injectable()
export class DocumentUploadService {
  private readonly logger = new Logger(DocumentUploadService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private aiExtractionService: AIExtractionService,
    @Optional() @Inject(STORAGE_SERVICE) private storageService?: StorageService
  ) {}

  async uploadWithMetadataExtraction(
    file: Express.Multer.File,
    uploadDto: DocumentUploadDto,
    userId: string
  ): Promise<VesselDocument | Certification | MedicalCertificate> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const entityId = this.validateAndNormalizeEntityId(uploadDto.entityId);

    // AI-Powered Metadata Extraction
    const metadata = await this.aiExtractionService.extractMetadata(file);

    const bucket =
      process.env.NODE_ENV === 'production'
        ? process.env.AWS_S3_BUCKET || ''
        : process.env.MINIO_BUCKET || 'documents';

    if (this.storageService && !bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    const storageKey = await this.storeFile(file, entityId, uploadDto.entityType, bucket);
    const expiryDate = this.normalizeDate(metadata.extractedExpiryDate || uploadDto.expiryDate);

    if (uploadDto.entityType === 'vessel') {
      return this.handleVesselDocument(file, uploadDto, metadata, storageKey, expiryDate, userId);
    } else if (uploadDto.entityType === 'crew') {
      return this.handleCrewDocument(file, uploadDto, metadata, storageKey, expiryDate, userId);
    } else {
      throw new BadRequestException(`Entity type ${uploadDto.entityType} is not supported`);
    }
  }

  private async handleVesselDocument(
    file: Express.Multer.File,
    uploadDto: DocumentUploadDto,
    metadata: DocumentMetadata,
    storageKey: string,
    expiryDate: Date | null,
    userId: string
  ): Promise<VesselDocument> {
    const document = await this.prisma.vesselDocument.create({
      data: {
        vesselId: uploadDto.entityId,
        type: metadata.detectedType || uploadDto.documentType || 'OTHER',
        title: uploadDto.name || file.originalname,
        description: JSON.stringify({
          ...(uploadDto.metadata || {}),
          ...metadata,
          originalFileName: file.originalname,
        }),
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype || 'application/octet-stream',
        s3Key: storageKey,
        expiryDate,
        status: DocumentStatus.VALID,
        uploadedById: userId,
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityId: document.id,
      entityType: 'document',
      userId,
      details: {
        documentType: document.type,
        storageKey,
        confidenceScore: metadata.confidence,
      },
      compliance: 'AI-Enhanced Vessel Document Upload',
    });

    return document;
  }

  private async handleCrewDocument(
    file: Express.Multer.File,
    uploadDto: DocumentUploadDto,
    metadata: DocumentMetadata,
    storageKey: string,
    expiryDate: Date | null,
    userId: string
  ): Promise<Certification | MedicalCertificate> {
    const detectedType = metadata.detectedType || uploadDto.documentType || 'OTHER';

    if (detectedType === 'MEDICAL_CERTIFICATE') {
      return this.handleMedicalCertificate(uploadDto, metadata, storageKey, expiryDate, userId);
    }

    // Default to STCW Certification for other types
    return this.handleCertification(uploadDto, metadata, storageKey, expiryDate, userId);
  }

  private async handleMedicalCertificate(
    uploadDto: DocumentUploadDto,
    metadata: DocumentMetadata,
    storageKey: string,
    expiryDate: Date | null,
    userId: string
  ): Promise<MedicalCertificate> {
    const medCert = await this.prisma.medicalCertificate.upsert({
      where: { crewId: uploadDto.entityId },
      create: {
        crewId: uploadDto.entityId,
        type: metadata.detectedType || 'MEDICAL',
        issuingAuthority: metadata.issuingAuthority || 'Unknown',
        issueDate: new Date(), // Extracted issue date would be better
        expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        documentUrl: storageKey,
      },
      update: {
        type: metadata.detectedType || 'MEDICAL',
        issuingAuthority: metadata.issuingAuthority || 'Unknown',
        expiryDate: expiryDate || undefined,
        documentUrl: storageKey,
      },
    });

    await this.auditService.log({
      action: 'UPDATE',
      entityId: medCert.id,
      entityType: 'medical_certificate',
      userId,
      details: { confidence: metadata.confidence },
      compliance: 'AI-Enhanced Medical Certificate Upload',
    });

    return medCert;
  }

  private async handleCertification(
    uploadDto: DocumentUploadDto,
    metadata: DocumentMetadata,
    storageKey: string,
    expiryDate: Date | null,
    userId: string
  ): Promise<Certification> {
    // Check for existing cert of same type on this crew member (renewal detection)
    const existingCert = await this.prisma.certification.findFirst({
      where: {
        crewId: uploadDto.entityId,
        type: (metadata.detectedType as any) || uploadDto.documentType || 'STCW_COC',
        status: { in: ['VALID', 'EXPIRING', 'PENDING_VERIFICATION'] },
        replacedById: null, // Not already superseded
      },
      orderBy: { createdAt: 'desc' },
    });

    // Confidence warnings for the verifier
    const aiWarnings: string[] = [];
    if (metadata.confidence < 0.5) {
      aiWarnings.push('Low confidence extraction — verify all fields carefully.');
    }
    if (!metadata.extractedExpiryDate) {
      aiWarnings.push('Expiry date was not found in the document — manual entry required.');
    }
    if (!metadata.certificateNumber) {
      aiWarnings.push('Certificate number was not found — verify against original document.');
    }

    // Always create as PENDING_VERIFICATION — never bypass the human check
    const cert = await this.prisma.certification.create({
      data: {
        crewId: uploadDto.entityId,
        type: (metadata.detectedType as any) || uploadDto.documentType || 'STCW_COC',
        certificateNumber: metadata.certificateNumber || 'PENDING',
        issuingAuthority: metadata.issuingAuthority || 'Unknown',
        issuingCountry: 'BS',
        issueDate: new Date(),
        expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        documentUrl: storageKey,
        status: 'PENDING_VERIFICATION', // ← NEVER set to VALID here
        createdById: userId,
        documentVerified: false,
        aiExtractedData: metadata as any,
        aiConfidenceScore: metadata.confidence,
        aiExtractionWarnings: aiWarnings,
        // Link to previous cert if renewal detected
        replacesId: existingCert?.id ?? null,
        notes: existingCert
          ? `Renewal of cert ${existingCert.id} (${existingCert.certificateNumber})`
          : `AI Extracted: ${JSON.stringify(metadata)}`,
      },
    });

    await this.auditService.log({
      action: 'CERTIFICATION_CREATE',
      entityId: cert.id,
      entityType: 'certification',
      userId,
      details: {
        confidence: metadata.confidence,
        certNumber: metadata.certificateNumber,
        pendingVerification: true,
        isRenewal: !!existingCert,
        replacesId: existingCert?.id,
      },
      compliance: 'AI-Enhanced STCW Certification Upload (Pending Verification)',
    });

    return cert;
  }

  private async storeFile(
    file: Express.Multer.File,
    entityId: string,
    entityType: string,
    bucket: string
  ): Promise<string> {
    const safeFileName = this.sanitizePathComponent(file.originalname || 'document');
    const safeEntityId = this.sanitizePathComponent(entityId);
    const key = `documents/${entityType}/${safeEntityId}/${Date.now()}-${safeFileName}`;

    if (!this.storageService) {
      return key;
    }

    await this.storageService.uploadFile(file, { bucket, key });
    return key;
  }

  private normalizeDate(input?: Date | string | null): Date | null {
    if (!input) return null;
    if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private validateAndNormalizeEntityId(entityId?: string): string {
    if (!entityId || typeof entityId !== 'string' || !entityId.trim()) {
      throw new BadRequestException('entityId is required and must be a non-empty string');
    }
    return entityId.trim();
  }

  private sanitizePathComponent(value: string): string {
    return (
      value
        .replace(/[\\/]+/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .slice(0, 128) || 'file'
    );
  }
}
