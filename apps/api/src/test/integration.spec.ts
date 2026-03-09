/**
 * Grand Bahama Ferry - Crew Compliance Integration Tests
 *
 * End-to-end testing for compliance workflows:
 * - Crew creation and STCW/BMA Certification
 * - Compliance dashboard updates and alert generation
 * - Document upload and auditing
 */

import { CertificationType, PrismaService } from '@gbferry/database';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../modules/audit/audit.service';
import { ComplianceService } from '../modules/compliance/compliance.service';
import { CertificationsService } from '../modules/crew/certifications.service';
import { CrewService } from '../modules/crew/crew.service';
import { VerificationService } from '../modules/crew/verification.service';
import { AIExtractionService } from '../modules/documents/ai-extraction.service';
import { DocumentQueryService } from '../modules/documents/document-query.service';
import {
  DocumentUploadService,
  STORAGE_SERVICE,
} from '../modules/documents/document-upload.service';

jest.mock('../modules/auth', () => ({
  CurrentUser: () => () => undefined,
  KeycloakUser: {} as any,
}));

describe.skip('Grand Bahama Ferry - Crew Compliance Integration (Requires local DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let crewService: CrewService;
  let certificationsService: CertificationsService;
  let complianceService: ComplianceService;
  let documentUploadService: DocumentUploadService;

  // Test IDs
  const testUserId = 'test-user-001';
  const testVesselId = 'test-vessel-001';

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
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
          useValue: { uploadFile: jest.fn().mockResolvedValue('test-key') },
        },
        {
          provide: 'VERIFICATION_GATEWAY',
          useValue: [
            {
              supports: () => true,
              verify: jest.fn().mockImplementation(async (cert: any) => ({
                verified: !cert.certificateNumber.includes('FAKE'),
                status: cert.certificateNumber.includes('FAKE') ? 'INVALID' : 'VALID',
                authorityResponse: { message: 'BMA Online Verification' },
                verificationDate: new Date(),
              })),
            },
          ],
        },
        {
          provide: 'ACE_GATEWAY',
          useValue: {
            submitCrewList: jest.fn().mockResolvedValue({
              submissionId: 'test-submit-123',
              status: 'ACCEPTED',
              message: 'Mock ACE Accepted',
              timestamp: new Date(),
            }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    crewService = moduleRef.get<CrewService>(CrewService);
    certificationsService = moduleRef.get<CertificationsService>(CertificationsService);
    complianceService = moduleRef.get<ComplianceService>(ComplianceService);
    documentUploadService = moduleRef.get<DocumentUploadService>(DocumentUploadService);

    await cleanupTestData();
    await seedTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function seedTestData() {
    await prisma.user.upsert({
      where: { id: 'system' },
      update: {},
      create: {
        id: 'system',
        keycloakId: 'system-keycloak',
        email: 'system@gbferry.com',
        firstName: 'System',
        lastName: 'User',
        role: 'system',
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        keycloakId: 'test-keycloak-001',
        email: 'test@gbferry.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      },
    });

    await prisma.vessel.upsert({
      where: { id: testVesselId },
      update: {},
      create: {
        id: testVesselId,
        name: 'MV Bahama Spirit',
        imoNumber: 'IMO1234567',
        type: 'PASSENGER_FERRY',
        grossTonnage: 2500,
        netTonnage: 1500,
        lengthOverall: 120,
        yearBuilt: 2015,
        flagState: 'BHS',
        portOfRegistry: 'Nassau',
        passengerCapacity: 0,
        crewCapacity: 50,
      },
    });
  }

  async function cleanupTestData() {
    await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
    await prisma.vesselDocument.deleteMany({ where: { vesselId: testVesselId } });
    await prisma.certification.deleteMany({});
    await prisma.medicalCertificate.deleteMany({});
    await prisma.crewMember.deleteMany({});
    await prisma.inspection.deleteMany({});
    await prisma.vessel.deleteMany({ where: { id: testVesselId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  }

  describe('AI Document Extraction', () => {
    it('should extract metadata and create certification for crew', async () => {
      const crew = await crewService.create(
        {
          familyName: 'Doe',
          givenNames: 'John',
          dateOfBirth: new Date('1990-01-01'),
          nationality: 'BHS',
          gender: 'M',
          passportNumber: 'PASS123',
          passportCountry: 'BHS',
          passportExpiry: new Date('2030-01-01'),
          role: 'MASTER',
          vesselId: testVesselId,
        } as any,
        testUserId
      );

      // Mock PDF file
      const mockFile: any = {
        originalname: 'master_cert.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from(
          '%PDF-1.4 ... STCW Master Certificate Expire: 2029-12-31 CertNo: STCW-999 Authority: BMA'
        ),
        size: 1024,
      };

      const result = await documentUploadService.uploadWithMetadataExtraction(
        mockFile,
        {
          name: 'Master Certification',
          entityType: 'crew',
          entityId: crew.id,
        },
        testUserId
      );

      expect(result).toBeDefined();
      expect((result as any).certificateNumber).toBe('STCW-999');
      expect((result as any).issuingAuthority).toBe('BMA');
      expect((result as any).expiryDate).toEqual(new Date('2029-12-31'));
    });
  });

  describe('Automated Verification', () => {
    it('should verify a certification against external BMA simulation', async () => {
      const crew = await crewService.create(
        {
          familyName: 'Smith',
          givenNames: 'Jane',
          dateOfBirth: new Date('1985-05-15'),
          nationality: 'BHS',
          gender: 'F',
          passportNumber: 'PASS456',
          passportCountry: 'BHS',
          passportExpiry: new Date('2030-01-01'),
          role: 'CHIEF_OFFICER',
          vesselId: testVesselId,
        } as any,
        testUserId
      );

      const cert = await certificationsService.create(
        {
          crewId: crew.id,
          type: CertificationType.STCW_COC,
          issueDate: new Date('2024-01-01'),
          expiryDate: new Date('2029-01-01'),
          issuingAuthority: 'Bahamas Maritime Authority',
          certificationNumber: 'BHS-COC-555',
        },
        testUserId
      );

      const verification = await certificationsService.verify(cert.id, testUserId);

      expect(verification.documentVerified).toBe(true);
      expect(verification.status).toBe('VALID');
      expect(verification.notes).toContain('BMA Online Verification');
    });

    it('should mark certification as INVALID if it has FAKE in the number', async () => {
      const crew = await crewService.create(
        {
          familyName: 'Jones',
          givenNames: 'Bob',
          dateOfBirth: new Date('1980-10-10'),
          nationality: 'BHS',
          gender: 'M',
          passportNumber: 'PASS789',
          passportCountry: 'BHS',
          passportExpiry: new Date('2030-01-01'),
          role: 'ENGINE_OFFICER',
          vesselId: testVesselId,
        } as any,
        testUserId
      );

      const cert = await certificationsService.create(
        {
          crewId: crew.id,
          type: CertificationType.STCW_COC,
          issueDate: new Date('2024-01-01'),
          expiryDate: new Date('2029-01-01'),
          issuingAuthority: 'Bahamas Maritime Authority',
          certificationNumber: 'BHS-FAKE-000',
        },
        testUserId
      );

      const verification = await certificationsService.verify(cert.id, testUserId);

      expect(verification.documentVerified).toBe(false);
      expect(verification.status).toBe('INVALID');
    });
  });

  describe('Advanced Reporting', () => {
    it('should generate fleet compliance snapshot', async () => {
      const report = await complianceService.getReports({
        type: 'fleet_compliance_snapshot',
      });

      expect(report.reportType).toBe('Fleet Compliance Snapshot');
      expect(report.vessels).toBeDefined();
      expect(report.summary.totalVessels).toBeGreaterThan(0);
    });
  });
});
