import { DocumentMetadata } from '@gbferry/dto';
import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import { OpenRouterService } from './openrouter.service';

@Injectable()
export class AIExtractionService {
  private readonly logger = new Logger(AIExtractionService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  /**
   * 2-Tier AI pipeline:
   * Tier 1 (Primary):  OpenRouter Vision LLM (if OPENROUTER_API_KEY is set)
   * Tier 2 (Fallback): Local OCR (Tesseract.js) + heuristic parsing
   */
  async extractMetadata(file: Express.Multer.File): Promise<DocumentMetadata> {
    this.logger.log(`Starting AI extraction for: ${file.originalname}`);

    // --- Tier 1: LLM Vision ---
    if (this.openRouterService.isConfigured && file.mimetype.startsWith('image/')) {
      try {
        const llmResult = await this.openRouterService.analyzeDocument(file.buffer, file.mimetype);
        if (llmResult && llmResult.detectedType) {
          this.logger.log(`LLM Vision extraction succeeded for: ${file.originalname}`);
          return {
            detectedType: llmResult.detectedType || 'OTHER',
            extractedExpiryDate: llmResult.extractedExpiryDate
              ? new Date(llmResult.extractedExpiryDate as unknown as string)
              : undefined,
            certificateNumber: llmResult.certificateNumber || undefined,
            issuingAuthority: llmResult.issuingAuthority || undefined,
            confidence: 0.92,
          };
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Tier 1 LLM Vision failed, falling back to OCR: ${msg}`);
      }
    }

    // --- Tier 2: Local OCR Fallback ---
    this.logger.log(`Running Tier 2 (Local OCR) for: ${file.originalname}`);
    try {
      const text = await this.extractText(file);
      return this.analyzeText(text);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`AI Extraction failed for ${file.originalname}: ${msg}`);
      return { detectedType: 'OTHER', confidence: 0 };
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    // Images: use Tesseract.js OCR
    if (file.mimetype.startsWith('image/')) {
      this.logger.log(`Running Tesseract OCR on image: ${file.originalname}`);
      const worker = await createWorker('eng');
      try {
        const { data } = await worker.recognize(file.buffer);
        return data.text || '';
      } finally {
        await worker.terminate();
      }
    }

    // PDFs: use pdf-parse
    if (file.mimetype === 'application/pdf') {
      const pdfParseModule = await import('pdf-parse');
      const parsePdf = pdfParseModule.default as unknown as (
        data: Buffer
      ) => Promise<{ text?: string }>;
      const data = await parsePdf(file.buffer);
      return data.text || '';
    }

    return '';
  }

  private analyzeText(text: string): DocumentMetadata {
    const lowerText = text.toLowerCase();

    const detectedType = this.detectDocumentType(lowerText);
    const extractedExpiryDate = this.extractExpiryDate(text);
    const certificateNumber = this.extractCertificateNumber(text);
    const issuingAuthority = this.extractIssuingAuthority(text);

    let confidence = text.length > 50 ? 0.3 : 0.1;
    if (detectedType !== 'OTHER') confidence += 0.2;
    if (extractedExpiryDate) confidence += 0.2;
    if (certificateNumber) confidence += 0.2;
    if (issuingAuthority) confidence += 0.1;

    return {
      detectedType,
      extractedExpiryDate: extractedExpiryDate || undefined,
      certificateNumber: certificateNumber || undefined,
      issuingAuthority: issuingAuthority || undefined,
      confidence: Math.min(confidence, 1),
    };
  }

  private detectDocumentType(text: string): string {
    if (
      text.includes('stcw') ||
      text.includes('standards of training') ||
      text.includes('competency')
    ) {
      if (text.includes('master') || text.includes('officer') || text.includes('engineer'))
        return 'STCW_COC';
      return 'STCW_COP';
    }
    if (text.includes('bahamas maritime authority') || text.includes('bma endorsement'))
      return 'BMA_ENDORSEMENT';
    if (text.includes('medical certificate') || text.includes('eng1') || text.includes('peme'))
      return 'MEDICAL_CERTIFICATE';
    if (text.includes('safe manning') || text.includes('r106')) return 'SAFE_MANNING_CERTIFICATE';
    if (text.includes('registration') || text.includes('r102')) return 'REGISTRATION_CERTIFICATE';
    return 'OTHER';
  }

  private extractExpiryDate(text: string): Date | null {
    const datePatterns = [
      /(?:valid until|expires?|expiry|valid to|date of expiry):?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(?:valid until|expires?|expiry|valid to|date of expiry):?\s*(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/i,
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:as expiry|is the expiry)/i,
    ];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const parsedDate = new Date(match[1]);
        if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
      }
    }
    return null;
  }

  private extractCertificateNumber(text: string): string | null {
    const patterns = [
      /(?:certificate|cert|license)\s*(?:no\.?|number|#)[:\s]*([A-Z0-9/-]{5,})/i,
      /(?:sid|seafarer id|id)\s*(?:no\.?|number)[:\s]*([A-Z0-9]{5,})/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }

  private extractIssuingAuthority(text: string): string | null {
    const patterns = [
      /(?:issuing authority|authority|administration|issued by)[:\s]*([A-Za-z\s]{3,50})/i,
      /(bahamas maritime authority|international maritime organization|maritime and coastguard agency)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }
}
