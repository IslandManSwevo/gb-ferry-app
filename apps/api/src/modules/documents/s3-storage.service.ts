import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, Logger } from '@nestjs/common';
import type { StorageOptions, StorageService } from './document-upload.service';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly logger = new Logger(S3StorageService.name);

  constructor() {
    const endpoint = process.env.AWS_S3_ENDPOINT || process.env.MINIO_ENDPOINT;
    const region = process.env.AWS_REGION || process.env.AWS_S3_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || '';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY || '';

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
      this.logger.error(`Failed to upload ${options.key}: ${err}`);
      throw err;
    }
  }
}
