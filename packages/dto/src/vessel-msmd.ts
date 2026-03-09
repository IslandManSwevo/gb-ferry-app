import { z } from 'zod';

export const UpsertVesselMSMDSchema = z.object({
  msmdReferenceNumber: z.string().min(1),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  // Mandatory requirements (R106)
  masterRequired: z.number().int().min(0),
  chiefOfficerRequired: z.number().int().min(0),
  deckOfficerRequired: z.number().int().min(0),
  chiefEngineerRequired: z.number().int().min(0),
  engineerOfficerRequired: z.number().int().min(0),
  ratingsDeckRequired: z.number().int().min(0),
  ratingsEngineRequired: z.number().int().min(0),
  securityOfficerRequired: z.number().int().min(0),
  radioOperatorRequired: z.number().int().min(0),
  cookRequired: z.number().int().min(0),
  crowdControlRequired: z.number().int().min(0),

  // Optional/Conditional
  maxPassengersForManning: z.number().int().min(0).optional(),
  operationalArea: z.string().optional(),
});

export type UpsertVesselMSMD = z.infer<typeof UpsertVesselMSMDSchema>;
