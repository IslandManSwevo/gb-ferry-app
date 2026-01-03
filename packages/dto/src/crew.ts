import { z } from 'zod';
import { GenderEnum, NationalitySchema } from './common';

/**
 * Crew DTOs
 * 
 * Aligned with BMA Seafarer Document Application and
 * Minimum Safe Manning Document (R106) requirements.
 */

// Crew roles (from BMA R106 Safe Manning)
export const CrewRoleEnum = z.enum([
  'MASTER',
  'CHIEF_OFFICER',
  'SECOND_OFFICER',
  'THIRD_OFFICER',
  'DECK_OFFICER',
  'CHIEF_ENGINEER',
  'SECOND_ENGINEER',
  'THIRD_ENGINEER',
  'ENGINE_OFFICER',
  'ELECTRO_TECHNICAL_OFFICER',
  'ABLE_SEAMAN',
  'ORDINARY_SEAMAN',
  'RATING',
  'CADET',
  'CHIEF_STEWARD',
  'STEWARD',
  'COOK',
  'OTHER',
]);
export type CrewRole = z.infer<typeof CrewRoleEnum>;

// Crew member identity (from BMA Seafarer Document Application)
export const CrewIdentitySchema = z.object({
  // Personal Details
  familyName: z.string().min(1).max(100),
  givenNames: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  placeOfBirth: z.string().max(100).optional(),
  nationality: NationalitySchema,
  gender: GenderEnum,
  
  // Photograph reference
  photographUrl: z.string().url().optional(),
  
  // Passport/ID
  passportNumber: z.string().min(1).max(50),
  passportIssuingCountry: NationalitySchema,
  passportExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  
  // Seaman's Record Book (optional)
  seamanBookNumber: z.string().max(50).optional(),
  seamanBookIssuingAuthority: z.string().max(100).optional(),
});
export type CrewIdentity = z.infer<typeof CrewIdentitySchema>;

// Medical certificate (from BMA requirements)
export const MedicalCertificateSchema = z.object({
  type: z.enum([
    'ENG_1', // UK ENG1 (recognized by BMA)
    'PEME',  // Pre-Employment Medical Examination
    'ILO_MLC', // ILO Maritime Labour Convention
    'OTHER',
  ]),
  issuingAuthority: z.string(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  documentUrl: z.string().url().optional(),
});
export type MedicalCertificate = z.infer<typeof MedicalCertificateSchema>;

// Create crew member request
export const CreateCrewMemberSchema = z.object({
  ...CrewIdentitySchema.shape,
  
  // Assignment
  role: CrewRoleEnum,
  vesselId: z.string().uuid().optional(),
  
  // Medical
  medicalCertificate: MedicalCertificateSchema.optional(),
  
  // Employment
  employmentStartDate: z.string().optional(),
  contractType: z.enum(['permanent', 'contract', 'temporary']).optional(),
});
export type CreateCrewMember = z.infer<typeof CreateCrewMemberSchema>;

// Crew member record
export const CrewMemberSchema = z.object({
  id: z.string().uuid(),
  ...CrewIdentitySchema.shape,
  
  // Assignment
  role: CrewRoleEnum,
  vesselId: z.string().uuid().nullable(),
  vesselName: z.string().nullable(),
  
  // Medical
  medicalCertificate: MedicalCertificateSchema.nullable(),
  
  // Compliance status (computed)
  complianceStatus: z.enum(['compliant', 'expiring', 'expired', 'incomplete']),
  expiringCertificationsCount: z.number(),
  
  // Status
  status: z.enum(['active', 'inactive', 'on_leave']),
  
  // Audit
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CrewMember = z.infer<typeof CrewMemberSchema>;

// Crew roster for a vessel
export const CrewRosterSchema = z.object({
  vesselId: z.string().uuid(),
  vesselName: z.string(),
  
  // Current crew
  crew: z.array(CrewMemberSchema),
  
  // Safe manning requirements (from R106)
  safeManningRequired: z.record(z.string(), z.number()),
  safeManningActual: z.record(z.string(), z.number()),
  
  // Compliance
  compliant: z.boolean(),
  discrepancies: z.array(z.object({
    role: z.string(),
    required: z.number(),
    actual: z.number(),
    message: z.string(),
  })),
});
export type CrewRoster = z.infer<typeof CrewRosterSchema>;

// Validation rules from Marine Notices (MN018, MN021, MN035)
export const validateCrewMember = (crew: CrewMember, sailingDate: Date): string[] => {
  const errors: string[] = [];
  
  // Passport expiry
  const passportExpiry = new Date(crew.passportExpiryDate);
  if (passportExpiry < sailingDate) {
    errors.push('Passport expired');
  }
  
  // Medical certificate expiry
  if (crew.medicalCertificate) {
    const medicalExpiry = new Date(crew.medicalCertificate.expiryDate);
    if (medicalExpiry < sailingDate) {
      errors.push('Medical certificate expired');
    }
  } else {
    errors.push('Medical certificate required');
  }
  
  return errors;
};
