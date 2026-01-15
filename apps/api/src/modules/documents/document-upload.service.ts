import { DocumentStatus, PrismaService, VesselDocument } from '@gbferry/database';
import { DocumentMetadata, DocumentUploadDto } from '@gbferry/dto';
import { BadRequestException, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

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
    @Optional() @Inject(STORAGE_SERVICE) private storageService?: StorageService
  ) {}

  async uploadWithMetadataExtraction(
    file: Express.Multer.File,
    uploadDto: DocumentUploadDto,
    userId: string
  ): Promise<VesselDocument> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (uploadDto.entityType !== 'vessel') {
      throw new BadRequestException('Only vessel documents are supported in this phase');
    }

    const vesselId = this.validateAndNormalizeEntityId(uploadDto.entityId);

    const metadata = await this.extractDocumentMetadata(file);
    const bucket =
      process.env.NODE_ENV === 'production'
        ? process.env.AWS_S3_BUCKET || ''
        : process.env.MINIO_BUCKET || 'documents';

    if (this.storageService && !bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    const storageKey = await this.storeFile(file, vesselId, bucket);

    const expiryDate = this.normalizeDate(metadata.extractedExpiryDate || uploadDto.expiryDate);

    const document = await this.prisma.vesselDocument.create({
      data: {
        vesselId: uploadDto.entityId,
        type: metadata.detectedType || uploadDto.documentType || 'OTHER',
        title: uploadDto.name || file.originalname,
        description: JSON.stringify({
          ...(uploadDto.metadata || {}),
          ...metadata,
          originalFileName: file.originalname,
          fileSize: file.size,
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
        fileName: file.originalname,
        storageKey,
        extractedMetadata: metadata,
        confidenceScore: metadata.confidence,
      },
    });

    return document;
  }

  private async storeFile(
    file: Express.Multer.File,
    vesselId: string,
    bucket: string
  ): Promise<string> {
    const safeFileName = this.sanitizePathComponent(file.originalname || 'document');
    const safeVesselId = this.sanitizePathComponent(vesselId);
    const key = `documents/vessel/${safeVesselId}/${Date.now()}-${safeFileName}`;
    if (!this.storageService) {
      // No storage adapter wired yet; return key for later upload.
      return key;
    }

    await this.storageService.uploadFile(file, { bucket, key });
    return key;
  }

  private async extractDocumentMetadata(file: Express.Multer.File): Promise<DocumentMetadata> {
    try {
      const pdfParseModule = await import('pdf-parse');
      const parsePdf = pdfParseModule.default as unknown as (
        data: Buffer
      ) => Promise<{ text?: string }>;
      const data = await parsePdf(file.buffer);
      const text = data.text || '';
      return {
        detectedType: this.detectDocumentType(text),
        extractedExpiryDate: this.extractExpiryDate(text) || undefined,
        certificateNumber: this.extractCertificateNumber(text) || undefined,
        issuingAuthority: this.extractIssuingAuthority(text) || undefined,
        confidence: this.calculateConfidence(text),
      };
    } catch (err) {
      this.logger.warn(
        `extractDocumentMetadata failed for file=${file?.originalname || 'unknown'}: ${err}`,
        err as any
      );
      return {
        detectedType: 'OTHER',
        confidence: 0,
      };
    }
  }

  private detectDocumentType(pdfText: string): string {
    const text = pdfText.toLowerCase();
    if (text.includes('safe manning') || text.includes('r106')) return 'SAFE_MANNING_CERTIFICATE';
    if (text.includes('stcw') || text.includes('certificate of competency'))
      return 'STCW_CERTIFICATE';
    if (text.includes('medical certificate')) return 'MEDICAL_CERTIFICATE';
    if (text.includes('registration') || text.includes('r102')) return 'REGISTRATION_CERTIFICATE';
    if (text.includes('safety management certificate') || text.includes('smc'))
      return 'SAFETY_MANAGEMENT_CERTIFICATE';
    if (text.includes('radio license') || text.includes('radio station')) return 'RADIO_LICENSE';
    if (text.includes('load line')) return 'LOAD_LINE_CERTIFICATE';
    return 'OTHER';
  }

  private extractExpiryDate(text: string): Date | null {
    const datePatterns = [
      /(?:valid until|expires?|expiry|valid to):?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(?:valid until|expires?|expiry|valid to):?\s*(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const parsedDate = new Date(match[1]);
        if (!Number.isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }

    return null;
  }

  private extractCertificateNumber(text: string): string | null {
    const pattern = /(certificate\s*(no\.|number)[:\s]*)([A-Z0-9-]+)/i;
    const match = text.match(pattern);
    return match ? match[3] : null;
  }

  private extractIssuingAuthority(text: string): string | null {
    const pattern = /(issuing authority|authority|administration)[:\s]*([A-Za-z\s]+)/i;
    const match = text.match(pattern);
    return match ? match[2].trim() : null;
  }

  private calculateConfidence(text: string): number {
    const lower = text.toLowerCase();
    let score = 0.2; // base confidence
    if (lower.includes('certificate')) score += 0.2;
    if (lower.includes('expiry') || lower.includes('valid until')) score += 0.2;
    if (lower.includes('authority')) score += 0.2;
    if (lower.includes('registration') || lower.includes('smc') || lower.includes('stcw'))
      score += 0.2;
    return Math.min(score, 1);
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
    const trimmed = entityId.trim();
    return trimmed;
  }

  private sanitizePathComponent(value: string): string {
    const normalized = value.normalize('NFKD');
    const strippedSeparators = normalized.replace(/[\\/]+/g, '');
    const noTraversal = strippedSeparators.replace(/\.\./g, '').replace(/^[.]+/, '');
    const safe = noTraversal.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 128);
    return safe || 'file';
  }
}
