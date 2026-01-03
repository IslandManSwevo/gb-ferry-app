import { z } from 'zod';
import { ExportFormatEnum, JurisdictionEnum } from './common';

/**
 * Compliance DTOs
 * 
 * Types for compliance reporting, exports, and inspections.
 */

// Compliance dashboard summary
export const ComplianceDashboardSchema = z.object({
  summary: z.object({
    totalVessels: z.number(),
    compliantVessels: z.number(),
    totalCrew: z.number(),
    compliantCrew: z.number(),
    expiringCertifications: z.number(),
    pendingManifests: z.number(),
    upcomingInspections: z.number(),
  }),
  
  // Recent activity
  recentActivity: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    timestamp: z.string(),
    userId: z.string(),
    userName: z.string(),
  })),
  
  // Alerts requiring attention
  alerts: z.array(z.object({
    id: z.string(),
    severity: z.enum(['critical', 'warning', 'info']),
    type: z.string(),
    message: z.string(),
    entityType: z.string(),
    entityId: z.string(),
    dueDate: z.string().optional(),
  })),
});
export type ComplianceDashboard = z.infer<typeof ComplianceDashboardSchema>;

// Compliance report types
export const ReportTypeEnum = z.enum([
  'PASSENGER_MANIFEST',
  'CREW_COMPLIANCE',
  'CERTIFICATION_STATUS',
  'SAFE_MANNING',
  'VESSEL_DOCUMENTS',
  'INSPECTION_HISTORY',
  'AUDIT_SUMMARY',
]);
export type ReportType = z.infer<typeof ReportTypeEnum>;

// Generate report request
export const GenerateReportSchema = z.object({
  type: ReportTypeEnum,
  format: ExportFormatEnum,
  jurisdiction: JurisdictionEnum.optional(),
  
  // Filters
  vesselId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  
  // Options
  includeSignature: z.boolean().optional(),
  includeWatermark: z.boolean().optional(),
});
export type GenerateReport = z.infer<typeof GenerateReportSchema>;

// Compliance report record
export const ComplianceReportSchema = z.object({
  id: z.string().uuid(),
  type: ReportTypeEnum,
  typeName: z.string(),
  format: ExportFormatEnum,
  jurisdiction: JurisdictionEnum,
  
  // File
  fileName: z.string(),
  fileSize: z.number(),
  downloadUrl: z.string(),
  
  // Generation
  generatedAt: z.string(),
  generatedBy: z.string().uuid(),
  generatedByName: z.string(),
  
  // Expiry (signed URLs expire)
  expiresAt: z.string(),
});
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;

// Inspection record
export const InspectionSchema = z.object({
  id: z.string().uuid(),
  vesselId: z.string().uuid(),
  vesselName: z.string(),
  
  // Inspection details
  type: z.enum([
    'PORT_STATE_CONTROL',
    'FLAG_STATE',
    'CLASS_SURVEY',
    'INTERNAL_AUDIT',
    'REGULATORY',
    'OTHER',
  ]),
  inspectingAuthority: z.string(),
  inspectorName: z.string().optional(),
  
  // Timing
  scheduledDate: z.string(),
  completedDate: z.string().optional(),
  
  // Results
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  result: z.enum(['passed', 'passed_with_observations', 'failed', 'pending']).optional(),
  
  // Findings
  deficiencies: z.array(z.object({
    code: z.string(),
    description: z.string(),
    severity: z.enum(['major', 'minor', 'observation']),
    deadline: z.string().optional(),
    resolved: z.boolean(),
    resolvedDate: z.string().optional(),
  })).optional(),
  
  // Documents
  reportUrl: z.string().optional(),
  
  // Notes
  notes: z.string().optional(),
  
  // Audit
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().uuid(),
});
export type Inspection = z.infer<typeof InspectionSchema>;

// Record inspection request
export const RecordInspectionSchema = z.object({
  vesselId: z.string().uuid(),
  type: InspectionSchema.shape.type,
  inspectingAuthority: z.string(),
  inspectorName: z.string().optional(),
  scheduledDate: z.string(),
  notes: z.string().optional(),
});
export type RecordInspection = z.infer<typeof RecordInspectionSchema>;
