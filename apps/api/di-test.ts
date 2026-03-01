// tsconfig.json has paths mapped! We can use @gbferry/database if we run via ts-node with tsconfig-paths, or we can just import from ../packages
import { Test, TestingModule } from '@nestjs/testing';
import 'reflect-metadata';
import { AuditService } from './src/modules/audit/audit.service';
import { ComplianceService } from './src/modules/compliance/compliance.service';
import { CertificationsService } from './src/modules/crew/certifications.service';
import { CrewService } from './src/modules/crew/crew.service';
import { VerificationService } from './src/modules/crew/verification.service';
import { AIExtractionService } from './src/modules/documents/ai-extraction.service';
import { DocumentQueryService } from './src/modules/documents/document-query.service';
import {
  DocumentUploadService,
  STORAGE_SERVICE,
} from './src/modules/documents/document-upload.service';

// Mock PrismaService
class MockPrismaService {}

async function run() {
  try {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: 'PrismaService', useClass: MockPrismaService },
        CrewService,
        CertificationsService,
        ComplianceService,
        AuditService,
        DocumentUploadService,
        DocumentQueryService,
        AIExtractionService,
        VerificationService,
        {
          provide: STORAGE_SERVICE,
          useValue: { uploadFile: () => Promise.resolve('test-key') },
        },
        {
          provide: 'VERIFICATION_GATEWAY',
          useValue: [],
        },
        {
          provide: 'ACE_GATEWAY',
          useValue: {},
        },
      ],
    }).compile();
    console.log('Success! Module created.');
  } catch (e: any) {
    console.error('DI ERROR:', e.message);
  }
}
run();
