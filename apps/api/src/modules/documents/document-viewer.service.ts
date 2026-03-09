import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';

const URL_EXPIRY_SECONDS = 300; // 5 minutes — short window prevents link sharing

@Injectable()
export class DocumentViewerService {
  private readonly logger = new Logger(DocumentViewerService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly config: ConfigService,
    private readonly auditService: AuditService
  ) {
    const endpoint = config.get<string>('AWS_S3_ENDPOINT') || config.get<string>('MINIO_ENDPOINT');

    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION') || 'us-east-1',
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId:
          config.get<string>('AWS_ACCESS_KEY_ID') || config.get<string>('MINIO_ACCESS_KEY') || '',
        secretAccessKey:
          config.get<string>('AWS_SECRET_ACCESS_KEY') ||
          config.get<string>('MINIO_SECRET_KEY') ||
          '',
      },
    });

    this.bucket =
      config.get<string>('NODE_ENV') === 'production'
        ? config.get<string>('AWS_S3_BUCKET') || ''
        : config.get<string>('MINIO_BUCKET') || 'gbferry-documents';
  }

  /**
   * Generate a short-lived pre-signed URL for viewing a stored document.
   * Every retrieval is audit-logged with the requesting user's ID.
   */
  async getSignedViewUrl(
    s3Key: string,
    requestingUserId: string,
    context: { entityType: string; entityId: string }
  ): Promise<{ url: string; expiresAt: string }> {
    if (!s3Key) {
      throw new ForbiddenException('No document is attached to this record.');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });

      const url = await getSignedUrl(this.s3 as any, command as any, {
        expiresIn: URL_EXPIRY_SECONDS,
      });

      const expiresAt = new Date(Date.now() + URL_EXPIRY_SECONDS * 1000).toISOString();

      // Audit every document retrieval — ISO 27001 A.12.4.3
      await this.auditService.log({
        action: 'CREW_PII_ACCESSED' as any,
        userId: requestingUserId,
        entityType: context.entityType,
        entityId: context.entityId,
        details: {
          documentKey: s3Key,
          expiresAt,
          note: 'Pre-signed document URL generated for viewing',
        },
      });

      return { url, expiresAt };
    } catch (error: any) {
      this.logger.error(`Error generating pre-signed URL for key ${s3Key}: ${error.message}`);
      throw new Error('Failed to generate document view URL');
    }
  }
}
