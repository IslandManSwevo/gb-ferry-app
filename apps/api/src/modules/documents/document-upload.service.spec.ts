import { DocumentStatus } from '@gbferry/database';
import { DocumentUploadService } from './document-upload.service';

jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn(() =>
    Promise.resolve({
      text: 'valid until 01/01/2030 certificate number ABC123 issuing authority Bahamas',
    })
  ),
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
      entityId: 'vessel-1',
      documentType: 'SAFE_MANNING_CERTIFICATE',
    } as any;

    prisma.vesselDocument.create.mockResolvedValue({
      id: 'doc-1',
      status: DocumentStatus.VALID,
    });

    const result = await service.uploadWithMetadataExtraction(file, dto, 'user-1');

    expect(storageService.uploadFile).toHaveBeenCalledWith(file, expect.any(Object));
    expect(prisma.vesselDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vesselId: 'vessel-1', uploadedById: 'user-1' }),
      })
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DOCUMENT_UPLOADED', userId: 'user-1' })
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
