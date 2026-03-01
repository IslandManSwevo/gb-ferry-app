import { Test, TestingModule } from '@nestjs/testing';
import { AIExtractionService } from './ai-extraction.service';
import { OpenRouterService } from './openrouter.service';

// Mock tesseract.js to avoid loading native binaries in test
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    recognize: jest.fn().mockResolvedValue({ data: { text: '' } }),
    terminate: jest.fn().mockResolvedValue(undefined),
  }),
}));

const mockOpenRouterService = {
  isConfigured: false,
  analyzeDocument: jest.fn(),
};

function makeFile(
  name: string,
  mimeType: string,
  buffer = Buffer.from('mock')
): Express.Multer.File {
  return {
    originalname: name,
    mimetype: mimeType,
    buffer,
  } as Express.Multer.File;
}

describe('AIExtractionService', () => {
  let service: AIExtractionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIExtractionService,
        { provide: OpenRouterService, useValue: mockOpenRouterService },
      ],
    }).compile();

    service = module.get<AIExtractionService>(AIExtractionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Tier 2 Fallback (heuristic only)', () => {
    it('should return OTHER with low confidence for empty text', async () => {
      const file = makeFile('blank.pdf', 'application/pdf');
      // PDF parsing will fail silently on empty buffer → '' → OTHER
      const result = await service.extractMetadata(file);
      expect(result.detectedType).toBe('OTHER');
    });
  });

  describe('Tier 1 — OpenRouter Vision', () => {
    it('should use LLM result when configured and returns valid data', async () => {
      mockOpenRouterService.isConfigured = true;
      mockOpenRouterService.analyzeDocument.mockResolvedValue({
        detectedType: 'STCW_COC',
        certificateNumber: 'BHS-2025-0001',
        issuingAuthority: 'Bahamas Maritime Authority',
      });

      const file = makeFile('stcw.jpg', 'image/jpeg');
      const result = await service.extractMetadata(file);

      expect(result.detectedType).toBe('STCW_COC');
      expect(result.certificateNumber).toBe('BHS-2025-0001');
      expect(result.confidence).toBe(0.92);
      expect(mockOpenRouterService.analyzeDocument).toHaveBeenCalledTimes(1);
    });

    it('should fall back to OCR if LLM throws an error', async () => {
      mockOpenRouterService.isConfigured = true;
      mockOpenRouterService.analyzeDocument.mockRejectedValue(new Error('API timeout'));

      const file = makeFile('cert.jpg', 'image/jpeg');
      const result = await service.extractMetadata(file);

      // Falls back gracefully — should not throw
      expect(result).toBeDefined();
      expect(result.detectedType).toBeDefined();
    });

    it('should skip LLM for PDFs even if configured', async () => {
      mockOpenRouterService.isConfigured = true;

      const file = makeFile('manifest.pdf', 'application/pdf');
      await service.extractMetadata(file);

      // LLM vision is only called for image/* mime types
      expect(mockOpenRouterService.analyzeDocument).not.toHaveBeenCalled();
    });
  });
});
