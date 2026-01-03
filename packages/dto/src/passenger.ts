import { z } from 'zod';
import { GenderEnum, IdentityDocTypeEnum, NationalitySchema } from './common';

/**
 * Passenger DTOs
 * 
 * Aligned with IMO FAL Form 5 (Crew/Passenger List) and 
 * Bahamas Customs passenger manifest requirements.
 */

// Base passenger identity (matches BMA fields)
export const PassengerIdentitySchema = z.object({
  familyName: z.string().min(1).max(100),
  givenNames: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  placeOfBirth: z.string().max(100).optional(),
  nationality: NationalitySchema,
  gender: GenderEnum,
});
export type PassengerIdentity = z.infer<typeof PassengerIdentitySchema>;

// Identity document (passport, etc.)
export const IdentityDocumentSchema = z.object({
  type: IdentityDocTypeEnum,
  number: z.string().min(1).max(50),
  issuingCountry: NationalitySchema,
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type IdentityDocument = z.infer<typeof IdentityDocumentSchema>;

// Passenger check-in request
export const PassengerCheckInSchema = z.object({
  // Identity
  ...PassengerIdentitySchema.shape,
  
  // Document
  identityDocument: IdentityDocumentSchema,
  
  // Voyage details
  sailingId: z.string().uuid(),
  portOfEmbarkation: z.string().min(2).max(50),
  portOfDisembarkation: z.string().min(2).max(50),
  cabinOrSeat: z.string().max(20).optional(),
  
  // Consent (required for GDPR/Bahamas DPA)
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'Passenger consent is required',
  }),
  consentTimestamp: z.string().optional(),
  
  // Special requirements
  specialInstructions: z.string().max(500).optional(),
});
export type PassengerCheckIn = z.infer<typeof PassengerCheckInSchema>;

// Passenger record (database representation)
export const PassengerSchema = z.object({
  id: z.string().uuid(),
  ...PassengerIdentitySchema.shape,
  identityDocument: IdentityDocumentSchema,
  sailingId: z.string().uuid(),
  portOfEmbarkation: z.string(),
  portOfDisembarkation: z.string(),
  cabinOrSeat: z.string().nullable(),
  specialInstructions: z.string().nullable(),
  
  // Status
  status: z.enum(['checked-in', 'boarded', 'no-show', 'cancelled']),
  checkInTime: z.string(),
  boardingTime: z.string().nullable(),
  
  // Consent
  consentGiven: z.boolean(),
  consentTimestamp: z.string(),
  
  // Audit
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().uuid(),
});
export type Passenger = z.infer<typeof PassengerSchema>;

// Passenger list filters
export const PassengerFiltersSchema = z.object({
  sailingId: z.string().uuid().optional(),
  date: z.string().optional(),
  status: z.enum(['checked-in', 'boarded', 'no-show', 'cancelled']).optional(),
  search: z.string().optional(),
});
export type PassengerFilters = z.infer<typeof PassengerFiltersSchema>;

// Validation rules from Marine Notices
export const validatePassengerDocument = (passenger: PassengerCheckIn, sailingDate: Date): string[] => {
  const errors: string[] = [];
  
  // Document must not be expired before sailing
  const docExpiry = new Date(passenger.identityDocument.expiryDate);
  if (docExpiry < sailingDate) {
    errors.push('Identity document expires before sailing date');
  }
  
  // Some countries require 6-month passport validity
  const sixMonthsFromSailing = new Date(sailingDate);
  sixMonthsFromSailing.setMonth(sixMonthsFromSailing.getMonth() + 6);
  if (docExpiry < sixMonthsFromSailing) {
    errors.push('Identity document should be valid for at least 6 months from sailing date');
  }
  
  return errors;
};
