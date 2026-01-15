import { z } from 'zod';
// US Compliance DTOs
import { PassengerSchema } from './passenger';
import { VesselSchema } from './vessel';

/**
 * US Regulatory Compliance DTOs
 *
 * Extensions for US Customs and Border Protection (CBP) APIS
 * and US Coast Guard (USCG) compliance.
 */

// US-specific Passenger Extensions
export const USPassengerDtoSchema = PassengerSchema.extend({
  // Add US-specific fields
  i94Number: z.string().optional(),
  cbpStatus: z.enum(['PENDING', 'APPROVED', 'DENIED']).optional(),
  visaType: z.string().optional(),
  admissionDate: z.coerce.date().optional(),
  authorizedStayUntil: z.coerce.date().optional(),

  // US travel document validation (overrides/extensions)
  // Note: These fields are already in PassengerSchema (via identityDocument) but flattened/validated here for CBP
  passportCountry: z.string().min(2).max(3).optional(), // ISO country code
  passportExpiry: z.coerce.date().min(new Date(), { message: 'Passport must be valid' }).optional(),
});

export type USPassengerDto = z.infer<typeof USPassengerDtoSchema>;

// CBP Manifest Structure (EDI 309 equivalent data)
export const CBPManifestDtoSchema = z.object({
  // Link to internal manifest
  manifestId: z.string().uuid(),

  // Vessel Info
  vesselInfo: VesselSchema,

  // Passengers with US data
  passengers: z.array(USPassengerDtoSchema),

  // CBP-specific Voyage fields
  portOfDeparture: z.string(), // Must be valid CBP port code
  portOfArrival: z.enum(['2704']), // Port Everglades code (as per requirements)
  estimatedArrivalTime: z.coerce.date(),
  voyageNumber: z.string(),

  // Submission Metadata
  submissionId: z.string().optional(),
  submissionTime: z.coerce.date().optional(),
});

export type CBPManifestDto = z.infer<typeof CBPManifestDtoSchema>;

// USCG Notification Schema
export const USCGNotificationSchema = z.object({
  manifestId: z.string().uuid(),
  vesselId: z.string().uuid(),
  notificationType: z.enum(['ARRIVAL', 'DEPARTURE']),
  submissionTime: z.coerce.date(),
  confirmationNumber: z.string().optional(),
});

export type USCGNotification = z.infer<typeof USCGNotificationSchema>;
