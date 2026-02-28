import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { AIExtractionService } from './ai-extraction.service';
import { DocumentQueryService } from './document-query.service';
import { DocumentUploadService, STORAGE_SERVICE } from './document-upload.service';
import { DocumentsController } from './documents.controller';
import { S3StorageService } from './s3-storage.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [DocumentsController],
  providers: [
    DocumentUploadService,
    DocumentQueryService,
    AIExtractionService,
    S3StorageService,
    { provide: STORAGE_SERVICE, useExisting: S3StorageService },
  ],
  exports: [DocumentUploadService, DocumentQueryService, AIExtractionService, S3StorageService, STORAGE_SERVICE],
})
export class DocumentsModule {}

