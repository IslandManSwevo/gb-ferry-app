"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordInspectionSchema = exports.InspectionSchema = exports.ComplianceReportSchema = exports.GenerateReportSchema = exports.ReportTypeEnum = exports.ComplianceDashboardSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.ComplianceDashboardSchema = zod_1.z.object({
    summary: zod_1.z.object({
        totalVessels: zod_1.z.number(),
        compliantVessels: zod_1.z.number(),
        totalCrew: zod_1.z.number(),
        compliantCrew: zod_1.z.number(),
        expiringCertifications: zod_1.z.number(),
        pendingManifests: zod_1.z.number(),
        upcomingInspections: zod_1.z.number(),
    }),
    recentActivity: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.string(),
        description: zod_1.z.string(),
        timestamp: zod_1.z.string(),
        userId: zod_1.z.string(),
        userName: zod_1.z.string(),
    })),
    alerts: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        severity: zod_1.z.enum(['critical', 'warning', 'info']),
        type: zod_1.z.string(),
        message: zod_1.z.string(),
        entityType: zod_1.z.string(),
        entityId: zod_1.z.string(),
        dueDate: zod_1.z.string().optional(),
    })),
});
exports.ReportTypeEnum = zod_1.z.enum([
    'PASSENGER_MANIFEST',
    'CREW_COMPLIANCE',
    'CERTIFICATION_STATUS',
    'SAFE_MANNING',
    'VESSEL_DOCUMENTS',
    'INSPECTION_HISTORY',
    'AUDIT_SUMMARY',
]);
exports.GenerateReportSchema = zod_1.z.object({
    type: exports.ReportTypeEnum,
    format: common_1.ExportFormatEnum,
    jurisdiction: common_1.JurisdictionEnum.optional(),
    vesselId: zod_1.z.string().uuid().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    includeSignature: zod_1.z.boolean().optional(),
    includeWatermark: zod_1.z.boolean().optional(),
});
exports.ComplianceReportSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: exports.ReportTypeEnum,
    typeName: zod_1.z.string(),
    format: common_1.ExportFormatEnum,
    jurisdiction: common_1.JurisdictionEnum,
    fileName: zod_1.z.string(),
    fileSize: zod_1.z.number(),
    downloadUrl: zod_1.z.string(),
    generatedAt: zod_1.z.string(),
    generatedBy: zod_1.z.string().uuid(),
    generatedByName: zod_1.z.string(),
    expiresAt: zod_1.z.string(),
});
exports.InspectionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    vesselId: zod_1.z.string().uuid(),
    vesselName: zod_1.z.string(),
    type: zod_1.z.enum([
        'PORT_STATE_CONTROL',
        'FLAG_STATE',
        'CLASS_SURVEY',
        'INTERNAL_AUDIT',
        'REGULATORY',
        'OTHER',
    ]),
    inspectingAuthority: zod_1.z.string(),
    inspectorName: zod_1.z.string().optional(),
    scheduledDate: zod_1.z.string(),
    completedDate: zod_1.z.string().optional(),
    status: zod_1.z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
    result: zod_1.z.enum(['passed', 'passed_with_observations', 'failed', 'pending']).optional(),
    deficiencies: zod_1.z.array(zod_1.z.object({
        code: zod_1.z.string(),
        description: zod_1.z.string(),
        severity: zod_1.z.enum(['major', 'minor', 'observation']),
        deadline: zod_1.z.string().optional(),
        resolved: zod_1.z.boolean(),
        resolvedDate: zod_1.z.string().optional(),
    })).optional(),
    reportUrl: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    createdBy: zod_1.z.string().uuid(),
});
exports.RecordInspectionSchema = zod_1.z.object({
    vesselId: zod_1.z.string().uuid(),
    type: exports.InspectionSchema.shape.type,
    inspectingAuthority: zod_1.z.string(),
    inspectorName: zod_1.z.string().optional(),
    scheduledDate: zod_1.z.string(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=compliance.js.map