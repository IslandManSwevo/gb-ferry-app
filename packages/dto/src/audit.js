"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportHistoryEntrySchema = exports.AuditLogResponseSchema = exports.AuditLogFiltersSchema = exports.AuditLogEntrySchema = exports.AuditActionEnum = exports.AuditEntityTypeEnum = void 0;
const zod_1 = require("zod");
exports.AuditEntityTypeEnum = zod_1.z.enum([
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
exports.AuditActionEnum = zod_1.z.enum([
    'create',
    'read',
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
exports.AuditLogEntrySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    entityType: exports.AuditEntityTypeEnum,
    entityId: zod_1.z.string(),
    entityName: zod_1.z.string().optional(),
    action: exports.AuditActionEnum,
    actionDescription: zod_1.z.string().optional(),
    userId: zod_1.z.string().uuid(),
    userName: zod_1.z.string(),
    userRole: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().optional(),
    previousValue: zod_1.z.any().optional(),
    newValue: zod_1.z.any().optional(),
    changedFields: zod_1.z.array(zod_1.z.string()).optional(),
    reason: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.AuditLogFiltersSchema = zod_1.z.object({
    entityType: exports.AuditEntityTypeEnum.optional(),
    entityId: zod_1.z.string().optional(),
    action: exports.AuditActionEnum.optional(),
    userId: zod_1.z.string().uuid().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(100).default(50),
});
exports.AuditLogResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.AuditLogEntrySchema),
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    limit: zod_1.z.number(),
    totalPages: zod_1.z.number(),
    filters: exports.AuditLogFiltersSchema.optional(),
});
exports.ExportHistoryEntrySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    exportType: zod_1.z.enum([
        'passenger_manifest',
        'crew_list',
        'certification_report',
        'vessel_documents',
        'compliance_report',
        'audit_log',
    ]),
    format: zod_1.z.enum(['csv', 'xlsx', 'pdf', 'xml']),
    entityType: exports.AuditEntityTypeEnum,
    entityIds: zod_1.z.array(zod_1.z.string()),
    recordCount: zod_1.z.number(),
    jurisdiction: zod_1.z.string().optional(),
    purpose: zod_1.z.string().optional(),
    exportedBy: zod_1.z.string().uuid(),
    exportedByName: zod_1.z.string(),
    exportedAt: zod_1.z.string(),
    fileName: zod_1.z.string(),
    fileSize: zod_1.z.number(),
    checksum: zod_1.z.string(),
    retainUntil: zod_1.z.string(),
});
//# sourceMappingURL=audit.js.map