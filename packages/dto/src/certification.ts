import { z } from 'zod';

/**
 * Certification DTOs
 * 
 * Aligned with STCW (Standards of Training, Certification and Watchkeeping)
 * and BMA Seafarer Document Application requirements.
 */

// STCW Certificate types
export const STCWCertTypeEnum = z.enum([
  // Deck Department
  'MASTER',
  'CHIEF_MATE',
  'OFFICER_OF_THE_WATCH_DECK',
  'RATING_FORMING_PART_OF_NAVIGATIONAL_WATCH',
  'ABLE_SEAFARER_DECK',
  
  // Engine Department
  'CHIEF_ENGINEER',
  'SECOND_ENGINEER',
  'OFFICER_OF_THE_WATCH_ENGINE',
  'RATING_FORMING_PART_OF_ENGINE_WATCH',
  'ABLE_SEAFARER_ENGINE',
  'ELECTRO_TECHNICAL_OFFICER',
  
  // Radio
  'GMDSS_GOC',
  'GMDSS_ROC',
  
  // Tanker
  'TANKER_FAMILIARIZATION',
  'OIL_TANKER_CARGO',
  'CHEMICAL_TANKER_CARGO',
  'LIQUEFIED_GAS_TANKER_CARGO',
  
  // Passenger Ships (most relevant for ferry)
  'PASSENGER_SHIP_CROWD_MANAGEMENT',
  'PASSENGER_SHIP_CRISIS_MANAGEMENT',
  'PASSENGER_SHIP_SAFETY',
  
  // Safety
  'BASIC_SAFETY_TRAINING',
  'SURVIVAL_CRAFT',
  'ADVANCED_FIREFIGHTING',
  'MEDICAL_FIRST_AID',
  'MEDICAL_CARE',
  'SECURITY_AWARENESS',
  'SHIP_SECURITY_OFFICER',
  
  // Other
  'ENDORSEMENT',
  'OTHER',
]);
export type STCWCertType = z.infer<typeof STCWCertTypeEnum>;

// Certificate status
export const CertificationStatusEnum = z.enum([
  'valid',
  'expiring',  // Within 30 days of expiry
  'expired',
  'revoked',
  'pending_verification',
]);
export type CertificationStatus = z.infer<typeof CertificationStatusEnum>;

// Create certification request
export const CreateCertificationSchema = z.object({
  crewId: z.string().uuid(),
  
  // Certificate details
  type: STCWCertTypeEnum,
  certificateNumber: z.string().min(1).max(100),
  issuingAuthority: z.string().min(1).max(200),
  issuingCountry: z.string().length(3),
  
  // Dates
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  
  // Document
  documentUrl: z.string().url().optional(),
  
  // Notes
  notes: z.string().max(500).optional(),
});
export type CreateCertification = z.infer<typeof CreateCertificationSchema>;

// Certification record
export const CertificationSchema = z.object({
  id: z.string().uuid(),
  crewId: z.string().uuid(),
  crewName: z.string(),
  
  // Certificate details
  type: STCWCertTypeEnum,
  typeName: z.string(), // Human-readable name
  certificateNumber: z.string(),
  issuingAuthority: z.string(),
  issuingCountry: z.string(),
  
  // Dates
  issueDate: z.string(),
  expiryDate: z.string(),
  daysUntilExpiry: z.number(),
  
  // Status
  status: CertificationStatusEnum,
  
  // Document
  documentUrl: z.string().nullable(),
  documentVerified: z.boolean(),
  
  // Audit
  createdAt: z.string(),
  updatedAt: z.string(),
  verifiedAt: z.string().nullable(),
  verifiedBy: z.string().uuid().nullable(),
});
export type Certification = z.infer<typeof CertificationSchema>;

// Certification filters
export const CertificationFiltersSchema = z.object({
  crewId: z.string().uuid().optional(),
  type: STCWCertTypeEnum.optional(),
  status: CertificationStatusEnum.optional(),
  expiringWithinDays: z.number().min(1).max(365).optional(),
});
export type CertificationFilters = z.infer<typeof CertificationFiltersSchema>;

// Role-to-certification mapping (from BMA requirements)
export const ROLE_CERTIFICATION_REQUIREMENTS: Record<string, string[]> = {
  MASTER: [
    'MASTER',
    'BASIC_SAFETY_TRAINING',
    'SURVIVAL_CRAFT',
    'ADVANCED_FIREFIGHTING',
    'MEDICAL_CARE',
    'GMDSS_GOC',
    'PASSENGER_SHIP_CROWD_MANAGEMENT',
    'PASSENGER_SHIP_CRISIS_MANAGEMENT',
    'SECURITY_AWARENESS',
    'SHIP_SECURITY_OFFICER',
  ],
  CHIEF_OFFICER: [
    'CHIEF_MATE',
    'BASIC_SAFETY_TRAINING',
    'SURVIVAL_CRAFT',
    'ADVANCED_FIREFIGHTING',
    'MEDICAL_FIRST_AID',
    'GMDSS_GOC',
    'PASSENGER_SHIP_CROWD_MANAGEMENT',
    'SECURITY_AWARENESS',
  ],
  DECK_OFFICER: [
    'OFFICER_OF_THE_WATCH_DECK',
    'BASIC_SAFETY_TRAINING',
    'GMDSS_ROC',
    'PASSENGER_SHIP_CROWD_MANAGEMENT',
    'SECURITY_AWARENESS',
  ],
  CHIEF_ENGINEER: [
    'CHIEF_ENGINEER',
    'BASIC_SAFETY_TRAINING',
    'ADVANCED_FIREFIGHTING',
    'MEDICAL_FIRST_AID',
  ],
  ENGINE_OFFICER: [
    'OFFICER_OF_THE_WATCH_ENGINE',
    'BASIC_SAFETY_TRAINING',
    'ADVANCED_FIREFIGHTING',
  ],
  ABLE_SEAMAN: [
    'ABLE_SEAFARER_DECK',
    'BASIC_SAFETY_TRAINING',
    'PASSENGER_SHIP_SAFETY',
    'SECURITY_AWARENESS',
  ],
  RATING: [
    'BASIC_SAFETY_TRAINING',
    'PASSENGER_SHIP_SAFETY',
    'SECURITY_AWARENESS',
  ],
};

// Validate crew certifications against role requirements
export const validateCrewCertifications = (
  role: string,
  certifications: Certification[],
  sailingDate: Date,
): { valid: boolean; missing: string[]; expired: string[] } => {
  const required = ROLE_CERTIFICATION_REQUIREMENTS[role] || [];
  const validCerts = certifications.filter(
    (c) => new Date(c.expiryDate) >= sailingDate
  );
  const validCertTypes = new Set(validCerts.map((c) => c.type));
  
  const missing = required.filter((r) => !validCertTypes.has(r as any));
  const expired = certifications
    .filter((c) => new Date(c.expiryDate) < sailingDate)
    .map((c) => c.type);
  
  return {
    valid: missing.length === 0 && expired.length === 0,
    missing,
    expired,
  };
};
