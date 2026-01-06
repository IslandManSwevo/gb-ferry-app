import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageOptions, StorageService } from './document-upload.service';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly logger = new Logger(S3StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const endpoint =
      this.configService.get<string>('AWS_S3_ENDPOINT') ||
      this.configService.get<string>('MINIO_ENDPOINT');

    const region =
      this.configService.get<string>('AWS_REGION') ||
      this.configService.get<string>('AWS_S3_REGION') ||
      'us-east-1';

    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID') ||
      this.configService.get<string>('MINIO_ACCESS_KEY') ||
      '';
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
      this.configService.get<string>('MINIO_SECRET_KEY') ||
      '';

    if (!region) {
      this.logger.error('S3 region is not configured (AWS_REGION or AWS_S3_REGION).');
      throw new Error('S3 region configuration is required');
    }

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'S3 credentials are not configured; proceeding without explicit credentials (anonymous/instance role).'
      );
    }

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  async uploadFile(file: Express.Multer.File, options: StorageOptions): Promise<string> {
    const params = {
      Bucket: options.bucket,
      Key: options.key,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
      ContentLength: file.size,
    } satisfies PutObjectCommand['input'];

    const uploader = new Upload({
      client: this.client,
      params,
    });

    try {
      await uploader.done();
      return options.key;
    } catch (err) {
      this.logger.error('Failed to upload', {
        key: options.key,
        message: (err as any)?.message,
        stack: (err as any)?.stack,
        error: err,
      });
      throw err;
    }
  }
}
