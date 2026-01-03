import { z } from 'zod';

/**
 * Common enums and types used across the platform
 */

// Gender enum (IMO FAL standard)
export const GenderEnum = z.enum(['M', 'F', 'X']);
export type Gender = z.infer<typeof GenderEnum>;

// Identity document types (BMA Seafarer Document Application)
export const IdentityDocTypeEnum = z.enum([
  'PASSPORT',
  'SEAMAN_BOOK',
  'NATIONAL_ID',
  'TRAVEL_DOCUMENT',
]);
export type IdentityDocType = z.infer<typeof IdentityDocTypeEnum>;

// ISO 3166-1 alpha-3 country codes (commonly used in maritime)
export const NationalitySchema = z.string().length(3).toUpperCase();

// Date validation helpers
export const FutureDateSchema = z.string().refine(
  (date) => new Date(date) > new Date(),
  { message: 'Date must be in the future' }
);

export const PastDateSchema = z.string().refine(
  (date) => new Date(date) < new Date(),
  { message: 'Date must be in the past' }
);

// Pagination
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: z.string(),
  });

// Paginated response
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

// Jurisdiction types for compliance adapter
export const JurisdictionEnum = z.enum(['bahamas', 'jamaica', 'barbados']);
export type Jurisdiction = z.infer<typeof JurisdictionEnum>;

// Export format types
export const ExportFormatEnum = z.enum(['csv', 'xlsx', 'pdf', 'xml']);
export type ExportFormat = z.infer<typeof ExportFormatEnum>;
