import { z } from 'zod';
export declare const DocumentUploadDtoSchema: z.ZodObject<{
    name: z.ZodString;
    entityType: z.ZodEnum<["vessel", "crew", "company"]>;
    entityId: z.ZodString;
    documentType: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    entityType: "vessel" | "crew" | "company";
    entityId: string;
    metadata?: Record<string, unknown> | undefined;
    expiryDate?: Date | undefined;
    documentType?: string | undefined;
}, {
    name: string;
    entityType: "vessel" | "crew" | "company";
    entityId: string;
    metadata?: Record<string, unknown> | undefined;
    expiryDate?: Date | undefined;
    documentType?: string | undefined;
}>;
export declare const DocumentMetadataSchema: z.ZodObject<{
    detectedType: z.ZodOptional<z.ZodString>;
    extractedExpiryDate: z.ZodOptional<z.ZodDate>;
    certificateNumber: z.ZodOptional<z.ZodString>;
    issuingAuthority: z.ZodOptional<z.ZodString>;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    issuingAuthority?: string | undefined;
    certificateNumber?: string | undefined;
    detectedType?: string | undefined;
    extractedExpiryDate?: Date | undefined;
}, {
    confidence: number;
    issuingAuthority?: string | undefined;
    certificateNumber?: string | undefined;
    detectedType?: string | undefined;
    extractedExpiryDate?: Date | undefined;
}>;
export type DocumentUploadDto = z.infer<typeof DocumentUploadDtoSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
