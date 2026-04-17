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
  'expiring', // Within 30 days of expiry
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
export const ROLE_CERTIFICATION_REQUIREMENTS: Record<string, STCWCertType[]> = {
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
  SECOND_ENGINEER: [
    'SECOND_ENGINEER',
    'BASIC_SAFETY_TRAINING',
    'ADVANCED_FIREFIGHTING',
    'MEDICAL_FIRST_AID',
  ],
  THIRD_ENGINEER: ['OFFICER_OF_THE_WATCH_ENGINE', 'BASIC_SAFETY_TRAINING', 'ADVANCED_FIREFIGHTING'],
  // Alias kept for backwards-compat; prefer THIRD_ENGINEER for new records
  ENGINE_OFFICER: ['OFFICER_OF_THE_WATCH_ENGINE', 'BASIC_SAFETY_TRAINING', 'ADVANCED_FIREFIGHTING'],
  ABLE_SEAMAN: [
    'ABLE_SEAFARER_DECK',
    'BASIC_SAFETY_TRAINING',
    'PASSENGER_SHIP_SAFETY',
    'SECURITY_AWARENESS',
  ],
  RATING: ['BASIC_SAFETY_TRAINING', 'PASSENGER_SHIP_SAFETY', 'SECURITY_AWARENESS'],
};

/** Normalise a Date to UTC midnight so local-timezone offsets don't shift the boundary day. */
const toUtcDay = (d: Date): number => {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy.getTime();
};

// Validate crew certifications against role requirements
export const validateCrewCertifications = (
  role: string,
  certifications: Certification[],
  sailingDate: Date
): { valid: boolean; missing: string[]; expired: string[] } => {
  const required = ROLE_CERTIFICATION_REQUIREMENTS[role] || [];
  const sailingDay = toUtcDay(sailingDate);

  const validCertTypes = new Set<STCWCertType>(
    certifications.filter((c) => toUtcDay(new Date(c.expiryDate)) >= sailingDay).map((c) => c.type)
  );

  const missing = required.filter((r) => !validCertTypes.has(r));
  // Only report expired certs that are actually required for this role
  const expired = certifications
    .filter((c) => required.includes(c.type) && toUtcDay(new Date(c.expiryDate)) < sailingDay)
    .map((c) => c.type);

  return {
    valid: missing.length === 0 && expired.length === 0,
    missing,
    expired,
  };
};
