import { DocumentMetadata } from '@gbferry/dto';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AIExtractionService {
  private readonly logger = new Logger(AIExtractionService.name);

  /**
   * Extracts structured metadata from a document using AI-driven analysis.
   * In a production environment, this would call an LLM (e.g., GPT-4o, Claude, or Gemini)
   * with a specialized prompt and potentially an OCR layer for scanned documents.
   */
  async extractMetadata(file: Express.Multer.File): Promise<DocumentMetadata> {
    this.logger.log(`Starting AI extraction for file: ${file.originalname}`);

    try {
      const text = await this.extractText(file);
      
      // If we were using a real LLM, we would send the 'text' to the LLM here.
      // For now, we use a sophisticated heuristic-based extraction that mimics AI behavior.
      return this.analyzeText(text);
    } catch (error) {
      this.logger.error(`AI Extraction failed for ${file.originalname}: ${error.message}`);
      return {
        detectedType: 'OTHER',
        confidence: 0,
      };
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const pdfParseModule = await import('pdf-parse');
      const parsePdf = pdfParseModule.default as unknown as (
        data: Buffer
      ) => Promise<{ text?: string }>;
      const data = await parsePdf(file.buffer);
      return data.text || '';
    }
    
    // For images, we would ideally use an OCR library like Tesseract.js or an AWS Textract/Google Vision call.
    // For now, we'll return an empty string or basic metadata if it's an image.
    if (file.mimetype.startsWith('image/')) {
      this.logger.warn(`Image OCR not implemented yet for ${file.originalname}. AI extraction limited.`);
      return ''; 
    }

    return '';
  }

  private analyzeText(text: string): DocumentMetadata {
    const lowerText = text.toLowerCase();
    
    // 1. Detect Document Type
    const detectedType = this.detectDocumentType(lowerText);
    
    // 2. Extract Expiry Date
    const extractedExpiryDate = this.extractExpiryDate(text);
    
    // 3. Extract Certificate Number
    const certificateNumber = this.extractCertificateNumber(text);
    
    // 4. Extract Issuing Authority
    const issuingAuthority = this.extractIssuingAuthority(text);
    
    // 5. Calculate Confidence based on key fields found
    let confidence = 0.3; // Base confidence if we got text
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
    // STCW Specifics
    if (text.includes('stcw') || text.includes('standards of training') || text.includes('competency')) {
      if (text.includes('master') || text.includes('officer') || text.includes('engineer')) return 'STCW_COC';
      return 'STCW_COP';
    }
    
    // BMA Specifics
    if (text.includes('bahamas maritime authority') || text.includes('bma endorsement')) return 'BMA_ENDORSEMENT';
    
    // Medical Specifics
    if (text.includes('medical certificate') || text.includes('eng1') || text.includes('peme')) return 'MEDICAL_CERTIFICATE';
    
    // Vessel Specifics
    if (text.includes('safe manning') || text.includes('r106')) return 'SAFE_MANNING_CERTIFICATE';
    if (text.includes('registration') || text.includes('r102')) return 'REGISTRATION_CERTIFICATE';
    
    return 'OTHER';
  }

  private extractExpiryDate(text: string): Date | null {
    const datePatterns = [
      /(?:valid until|expires?|expiry|valid to|date of expiry):?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(?:valid until|expires?|expiry|valid to|date of expiry):?\s*(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/i,
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:as expiry|is the expiry)/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const parsedDate = new Date(match[1]);
        if (!Number.isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    return null;
  }

  private extractCertificateNumber(text: string): string | null {
    const patterns = [
      /(?:certificate|cert|license)\s*(?:no\.?|number|#)[:\s]*([A-Z0-9/-]{5,})/i,
      /(?:sid|seafarer id|id)\s*(?:no\.?|number)[:\s]*([A-Z0-9]{5,})/i
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
      /(bahamas maritime authority|international maritime organization|maritime and coastguard agency)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  }
}
