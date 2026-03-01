import { DocumentMetadata } from '@gbferry/dto';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

const MARITIME_EXTRACTION_PROMPT = `
You are an expert maritime certification analyst.
Analyze the provided document image and extract the following fields as structured JSON.

Fields:
- detectedType: One of [STCW_COC, STCW_COP, BMA_ENDORSEMENT, MEDICAL_CERTIFICATE, SAFE_MANNING_CERTIFICATE, REGISTRATION_CERTIFICATE, OTHER]
- extractedExpiryDate: ISO 8601 date string (e.g., "2026-05-01"). Only if a clear expiry/valid-until date is found.
- certificateNumber: The official certificate or license number as a string.
- issuingAuthority: The name of the government body or authority that issued the document (e.g., "Bahamas Maritime Authority", "Maritime and Coastguard Agency").

Return ONLY a valid JSON object. Omit any field you cannot confidently extract.
Example: { "detectedType": "STCW_COC", "certificateNumber": "BHS-2024-04821", "issuingAuthority": "Bahamas Maritime Authority" }
`.trim();

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.model = this.configService.get<string>('DOCUMENT_MODEL') || 'google/gemma-3-27b-it:free';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async analyzeDocument(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<Partial<DocumentMetadata> | null> {
    if (!this.isConfigured) {
      this.logger.warn('OPENROUTER_API_KEY not set. Skipping LLM Vision analysis.');
      return null;
    }

    const base64Image = imageBuffer.toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: this.model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: MARITIME_EXTRACTION_PROMPT },
                  {
                    type: 'image_url',
                    image_url: { url: `data:${mimeType};base64,${base64Image}` },
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'HTTP-Referer': 'https://github.com/IslandManSwevo/gb-ferry-app',
              'X-Title': 'GB Ferry Compliance Platform',
              'Content-Type': 'application/json',
            },
          }
        )
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) return null;

      this.logger.debug(`OpenRouter raw response: ${content}`);
      return JSON.parse(content) as Partial<DocumentMetadata>;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`OpenRouter Vision analysis failed: ${msg}`);
      return null;
    }
  }
}
