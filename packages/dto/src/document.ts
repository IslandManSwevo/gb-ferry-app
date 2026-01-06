import { z } from 'zod';

// Document upload DTO for vessel/crew/company entities
export const DocumentUploadDtoSchema = z.object({
  name: z.string().min(1),
  entityType: z.enum(['vessel', 'crew', 'company']),
  entityId: z.string().uuid(),
  documentType: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
 metadata: z.record(z.unknown()).optional(),
});

export const DocumentMetadataSchema = z.object({
  detectedType: z.string().optional(),
  extractedExpiryDate: z.coerce.date().optional(),
  certificateNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type DocumentUploadDto = z.infer<typeof DocumentUploadDtoSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
