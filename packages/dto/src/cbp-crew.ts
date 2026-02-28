import { z } from 'zod';
import { CrewMemberSchema } from './crew';
import { VesselSchema } from './vessel';

/**
 * US Regulatory Crew Compliance DTOs
 *
 * Focuses on Form I-418 and eNOAD (Electronic Notice of Arrival/Departure).
 */

// I-418 Crew Member Extensions
export const USCbpCrewMemberDtoSchema = CrewMemberSchema.extend({
  // CBP Specific Fields (I-418)
  alienRegistrationNumber: z.string().optional(),
  usVisaNumber: z.string().optional(),
  usVisaType: z.enum(['B1', 'B2', 'B1/B2', 'D', 'C1/D']).optional(),
  usVisaExpiry: z.coerce.date().optional(),
  
  // Port State Control (PSC) Status
  pscStatus: z.enum(['CLEAR', 'NOTED', 'DETAINED']).optional(),
  
  // Travel Document (ISO Country & Expiry)
  passportCountry: z.string().length(3), // ISO 3166-1 alpha-3
  passportExpiry: z.coerce.date().min(new Date(), { message: 'Passport must be valid' }),
});

export type USCbpCrewMemberDto = z.infer<typeof USCbpCrewMemberDtoSchema>;

// CBP Form I-418 (Crew List) Structure
export const CbpI418ManifestDtoSchema = z.object({
  submissionId: z.string().uuid().optional(),
  
  // Vessel context
  vessel: VesselSchema,
  
  // Crew roster for the manifest
  crewMembers: z.array(USCbpCrewMemberDtoSchema),
  
  // Voyage details
  arrivalPort: z.enum(['2704']), // Port Everglades
  departurePort: z.string(),
  eta: z.coerce.date(),
  etd: z.coerce.date(),
  voyageNumber: z.string(),
  
  // Status
  status: z.enum(['DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED']),
  submittedAt: z.coerce.date().optional(),
});

export type CbpI418ManifestDto = z.infer<typeof CbpI418ManifestDtoSchema>;
