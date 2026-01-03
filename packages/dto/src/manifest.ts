import { z } from 'zod';

/**
 * Manifest DTOs
 * 
 * Aligned with IMO FAL Form 5 and Bahamas Maritime Authority requirements.
 * Manifests require MANUAL APPROVAL before submission to authorities.
 */

// Manifest status workflow
export const ManifestStatusEnum = z.enum([
  'draft',      // Initial generation, can be edited
  'pending',    // Ready for approval review
  'approved',   // Manually approved, ready for submission
  'submitted',  // Marked as submitted to authorities (manual process)
  'rejected',   // Rejected during approval, needs correction
]);
export type ManifestStatus = z.infer<typeof ManifestStatusEnum>;

// Manifest validation error
export const ManifestValidationErrorSchema = z.object({
  passengerId: z.string().uuid().optional(),
  field: z.string(),
  message: z.string(),
  severity: z.enum(['error', 'warning']),
});
export type ManifestValidationError = z.infer<typeof ManifestValidationErrorSchema>;

// Generate manifest request
export const GenerateManifestSchema = z.object({
  sailingId: z.string().uuid(),
  vesselId: z.string().uuid(),
  departurePort: z.string(),
  arrivalPort: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string().optional(),
});
export type GenerateManifest = z.infer<typeof GenerateManifestSchema>;

// Manifest approval request
export const ApproveManifestSchema = z.object({
  approverId: z.string().uuid(),
  approverName: z.string(),
  approverRole: z.string(),
  notes: z.string().optional(),
  
  // Digital signature/confirmation
  confirmationChecks: z.object({
    passengerDataVerified: z.boolean(),
    documentExpiryChecked: z.boolean(),
    crewRosterComplete: z.boolean(),
    safeManningCompliant: z.boolean(),
  }),
});
export type ApproveManifest = z.infer<typeof ApproveManifestSchema>;

// Manifest record
export const ManifestSchema = z.object({
  id: z.string().uuid(),
  sailingId: z.string().uuid(),
  vesselId: z.string().uuid(),
  vesselName: z.string(),
  imoNumber: z.string(),
  
  // Voyage details
  departurePort: z.string(),
  arrivalPort: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string().nullable(),
  
  // Counts
  passengerCount: z.number(),
  crewCount: z.number(),
  
  // Status
  status: ManifestStatusEnum,
  validationErrors: z.array(ManifestValidationErrorSchema),
  
  // Approval chain
  generatedAt: z.string(),
  generatedBy: z.string().uuid(),
  approvedAt: z.string().nullable(),
  approvedBy: z.string().uuid().nullable(),
  submittedAt: z.string().nullable(),
  submittedBy: z.string().uuid().nullable(),
  
  // Audit
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Manifest = z.infer<typeof ManifestSchema>;

// IMO FAL Form 5 row (export format)
export const FalForm5RowSchema = z.object({
  // Sequence number on manifest
  sequenceNumber: z.number(),
  
  // Personal details (uppercase for BMA)
  familyName: z.string(),
  givenNames: z.string(),
  rankOrRating: z.string(), // 'PASSENGER' for passengers
  nationality: z.string(),
  dateOfBirth: z.string(),
  placeOfBirth: z.string(),
  gender: z.string(),
  
  // Document
  identityDocType: z.string(),
  identityDocNumber: z.string(),
  identityDocExpiry: z.string(),
  
  // Voyage
  portOfEmbarkation: z.string(),
  portOfDisembarkation: z.string(),
});
export type FalForm5Row = z.infer<typeof FalForm5RowSchema>;
