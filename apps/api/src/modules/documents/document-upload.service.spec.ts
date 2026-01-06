import { DocumentStatus } from '@gbferry/database';
import pdfParse from 'pdf-parse';
import { DocumentUploadService } from './document-upload.service';

jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('DocumentUploadService', () => {
  const prisma = {
    vesselDocument: {
      create: jest.fn(),
    },
  } as any;

  const auditService = {
    log: jest.fn(),
  } as any;

  const storageService = {
    uploadFile: jest.fn().mockResolvedValue('documents/vessel/doc-key.pdf'),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (pdfParse as unknown as jest.Mock).mockResolvedValue({
      text: 'valid until 01/01/2030 certificate number ABC123 issuing authority Bahamas',
    });
  });

  it('uploads vessel documents, extracts metadata, and persists audit log', async () => {
    const service = new DocumentUploadService(prisma, auditService, storageService);
    const file = {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 123,
      buffer: Buffer.from('pdf data'),
    } as Express.Multer.File;

    const dto = {
      name: 'Safe Manning',
      entityType: 'vessel',
      entityId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'SAFE_MANNING_CERTIFICATE',
    } as any;

    prisma.vesselDocument.create.mockResolvedValue({
      id: 'doc-1',
      status: DocumentStatus.VALID,
    });

    const result = await service.uploadWithMetadataExtraction(file, dto, 'user-1');

    expect(storageService.uploadFile).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        bucket: expect.any(String),
        key: expect.stringContaining('documents/vessel/123e4567-e89b-12d3-a456-426614174000'),
      })
    );

    expect(prisma.vesselDocument.create).toHaveBeenCalled();
    const createArgs = prisma.vesselDocument.create.mock.calls[0][0];
    expect(createArgs).toMatchObject({
      data: expect.objectContaining({
        vesselId: '123e4567-e89b-12d3-a456-426614174000',
        uploadedById: 'user-1',
        expiryDate: expect.any(Date),
      }),
    });

    const description = JSON.parse(createArgs.data.description);
    expect(description.certificateNumber).toBe('ABC123');
    expect(description.issuingAuthority).toBe('Bahamas');
    expect(new Date(description.extractedExpiryDate).getTime()).not.toBeNaN();
    expect(description.originalFileName).toBe('test.pdf');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE', userId: 'user-1' })
    );
    expect(result).toEqual(expect.objectContaining({ id: 'doc-1' }));
  });

  it('rejects non-vessel uploads during phased rollout', async () => {
    const service = new DocumentUploadService(prisma, auditService, storageService);
    const file = {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 100,
      buffer: Buffer.from('data'),
    } as Express.Multer.File;

    await expect(
      service.uploadWithMetadataExtraction(
        file,
        { name: 'Crew Doc', entityType: 'crew', entityId: 'crew-1' } as any,
        'user-1'
      )
    ).rejects.toThrow('Only vessel documents are supported in this phase');
  });
});
