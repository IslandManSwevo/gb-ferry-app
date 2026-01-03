import { z } from 'zod';

/**
 * Vessel DTOs
 * 
 * Aligned with BMA Vessel Registration Forms (R102, R103, R104, R105, R106)
 */

// Vessel types
export const VesselTypeEnum = z.enum([
  'PASSENGER_FERRY',
  'RO_RO_PASSENGER',
  'HIGH_SPEED_CRAFT',
  'CARGO',
  'TANKER',
  'OTHER',
]);
export type VesselType = z.infer<typeof VesselTypeEnum>;

// Vessel document types
export const VesselDocumentTypeEnum = z.enum([
  // Registration (R102-R105)
  'CERTIFICATE_OF_REGISTRY',
  'DECLARATION_OF_OWNERSHIP',
  'MANAGING_OWNER_REGISTRATION',
  'AUTHORIZED_OFFICER_APPOINTMENT',
  
  // Safety & Compliance
  'SAFETY_MANAGEMENT_CERTIFICATE',
  'DOCUMENT_OF_COMPLIANCE',
  'PASSENGER_SHIP_SAFETY_CERTIFICATE',
  'MINIMUM_SAFE_MANNING_DOCUMENT',
  'INTERNATIONAL_TONNAGE_CERTIFICATE',
  'LOAD_LINE_CERTIFICATE',
  
  // Insurance
  'P_AND_I_INSURANCE',
  'HULL_INSURANCE',
  
  // Lease
  'WET_LEASE_AGREEMENT',
  'DRY_LEASE_AGREEMENT',
  'BAREBOAT_CHARTER',
  
  // Other
  'CLASS_CERTIFICATE',
  'OTHER',
]);
export type VesselDocumentType = z.infer<typeof VesselDocumentTypeEnum>;

// Owner/Managing Owner information (from R102, R104)
export const OwnerInfoSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['individual', 'company']),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().length(3),
  }),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  registrationNumber: z.string().optional(), // Company registration
});
export type OwnerInfo = z.infer<typeof OwnerInfoSchema>;

// Create vessel request (based on R102)
export const CreateVesselSchema = z.object({
  // Basic identification
  name: z.string().min(1).max(100),
  imoNumber: z.string().regex(/^IMO\d{7}$/), // IMO format validation
  officialNumber: z.string().max(50).optional(),
  callSign: z.string().max(20).optional(),
  mmsi: z.string().length(9).optional(), // Maritime Mobile Service Identity
  
  // Flag & Registry
  flagState: z.string().length(3).default('BHS'), // Default Bahamas
  portOfRegistry: z.string().default('Nassau'),
  
  // Type & Class
  type: VesselTypeEnum,
  classificationSociety: z.string().optional(),
  classNotation: z.string().optional(),
  
  // Dimensions
  grossTonnage: z.number().positive(),
  netTonnage: z.number().positive(),
  lengthOverall: z.number().positive(),
  breadth: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  
  // Capacity (for passenger vessels)
  passengerCapacity: z.number().nonnegative().optional(),
  crewCapacity: z.number().nonnegative().optional(),
  vehicleCapacity: z.number().nonnegative().optional(),
  
  // Propulsion
  engineType: z.string().optional(),
  engineCount: z.number().optional(),
  propulsionPower: z.number().optional(), // kW
  
  // Ownership
  registeredOwner: OwnerInfoSchema,
  managingOwner: OwnerInfoSchema.optional(),
  
  // Build
  yearBuilt: z.number().min(1900).max(new Date().getFullYear()),
  builder: z.string().optional(),
  buildCountry: z.string().length(3).optional(),
});
export type CreateVessel = z.infer<typeof CreateVesselSchema>;

// Vessel record
export const VesselSchema = z.object({
  id: z.string().uuid(),
  ...CreateVesselSchema.shape,
  
  // Status
  status: z.enum(['active', 'inactive', 'laid_up', 'sold']),
  
  // Compliance summary (computed)
  complianceStatus: z.object({
    safeManningCompliant: z.boolean(),
    documentsValid: z.boolean(),
    insuranceValid: z.boolean(),
    certificatesValid: z.boolean(),
  }),
  
  // Document count
  documentCount: z.number(),
  expiringDocumentsCount: z.number(),
  
  // Audit
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Vessel = z.infer<typeof VesselSchema>;

// Vessel document
export const VesselDocumentSchema = z.object({
  id: z.string().uuid(),
  vesselId: z.string().uuid(),
  
  // Document info
  type: VesselDocumentTypeEnum,
  typeName: z.string(),
  title: z.string(),
  description: z.string().optional(),
  
  // File
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  documentUrl: z.string(), // S3 signed URL
  
  // Validity
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  daysUntilExpiry: z.number().nullable(),
  
  // Status
  status: z.enum(['valid', 'expiring', 'expired', 'pending_review']),
  verified: z.boolean(),
  
  // Audit
  uploadedAt: z.string(),
  uploadedBy: z.string().uuid(),
  verifiedAt: z.string().nullable(),
  verifiedBy: z.string().uuid().nullable(),
});
export type VesselDocument = z.infer<typeof VesselDocumentSchema>;

// Safe Manning Document (R106)
export const SafeManningRequirementSchema = z.object({
  vesselId: z.string().uuid(),
  
  // Document reference
  documentNumber: z.string(),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  issuingAuthority: z.string().default('Bahamas Maritime Authority'),
  
  // Requirements by role
  requirements: z.array(z.object({
    role: z.string(),
    minimumCount: z.number(),
    certificateRequired: z.string(),
    notes: z.string().optional(),
  })),
});
export type SafeManningRequirement = z.infer<typeof SafeManningRequirementSchema>;
