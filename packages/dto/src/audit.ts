import { z } from 'zod';

/**
 * Audit DTOs
 * 
 * Types for immutable audit logging.
 * All sensitive operations are logged for regulatory compliance.
 */

// Entity types that can be audited
export const AuditEntityTypeEnum = z.enum([
  'passenger',
  'crew',
  'vessel',
  'manifest',
  'certification',
  'document',
  'sailing',
  'inspection',
  'user',
  'system',
]);
export type AuditEntityType = z.infer<typeof AuditEntityTypeEnum>;

// Audit actions
export const AuditActionEnum = z.enum([
  'create',
  'read',      // For sensitive data access
  'update',
  'delete',
  'export',
  'approve',
  'reject',
  'submit',
  'login',
  'logout',
  'failed_login',
  'permission_change',
]);
export type AuditAction = z.infer<typeof AuditActionEnum>;

// Audit log entry
export const AuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  
  // What was affected
  entityType: AuditEntityTypeEnum,
  entityId: z.string(),
  entityName: z.string().optional(), // Human-readable reference
  
  // What happened
  action: AuditActionEnum,
  actionDescription: z.string().optional(),
  
  // Who did it
  userId: z.string().uuid(),
  userName: z.string(),
  userRole: z.string(),
  
  // When
  timestamp: z.string(),
  
  // Where (security context)
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  
  // Change details (for updates)
  previousValue: z.any().optional(),
  newValue: z.any().optional(),
  changedFields: z.array(z.string()).optional(),
  
  // Why (optional justification)
  reason: z.string().optional(),
  
  // Additional metadata
  metadata: z.record(z.any()).optional(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

// Audit log filters
export const AuditLogFiltersSchema = z.object({
  entityType: AuditEntityTypeEnum.optional(),
  entityId: z.string().optional(),
  action: AuditActionEnum.optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});
export type AuditLogFilters = z.infer<typeof AuditLogFiltersSchema>;

// Audit log response
export const AuditLogResponseSchema = z.object({
  data: z.array(AuditLogEntrySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  filters: AuditLogFiltersSchema.optional(),
});
export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;

// Export history entry (special tracking for data exports)
export const ExportHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  
  // What was exported
  exportType: z.enum([
    'passenger_manifest',
    'crew_list',
    'certification_report',
    'vessel_documents',
    'compliance_report',
    'audit_log',
  ]),
  format: z.enum(['csv', 'xlsx', 'pdf', 'xml']),
  
  // Scope
  entityType: AuditEntityTypeEnum,
  entityIds: z.array(z.string()),
  recordCount: z.number(),
  
  // Context
  jurisdiction: z.string().optional(),
  purpose: z.string().optional(),
  
  // Who & When
  exportedBy: z.string().uuid(),
  exportedByName: z.string(),
  exportedAt: z.string(),
  
  // File
  fileName: z.string(),
  fileSize: z.number(),
  checksum: z.string(), // SHA-256 for integrity verification
  
  // Retention
  retainUntil: z.string(), // Based on data protection requirements
});
export type ExportHistoryEntry = z.infer<typeof ExportHistoryEntrySchema>;
