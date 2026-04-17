import { z } from 'zod';
export declare const ComplianceDashboardSchema: z.ZodObject<{
    summary: z.ZodObject<{
        totalVessels: z.ZodNumber;
        compliantVessels: z.ZodNumber;
        totalCrew: z.ZodNumber;
        compliantCrew: z.ZodNumber;
        expiringCertifications: z.ZodNumber;
        pendingManifests: z.ZodNumber;
        upcomingInspections: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalVessels: number;
        compliantVessels: number;
        totalCrew: number;
        compliantCrew: number;
        expiringCertifications: number;
        pendingManifests: number;
        upcomingInspections: number;
    }, {
        totalVessels: number;
        compliantVessels: number;
        totalCrew: number;
        compliantCrew: number;
        expiringCertifications: number;
        pendingManifests: number;
        upcomingInspections: number;
    }>;
    recentActivity: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        description: z.ZodString;
        timestamp: z.ZodString;
        userId: z.ZodString;
        userName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        type: string;
        id: string;
        userName: string;
        timestamp: string;
        userId: string;
    }, {
        description: string;
        type: string;
        id: string;
        userName: string;
        timestamp: string;
        userId: string;
    }>, "many">;
    alerts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        severity: z.ZodEnum<["critical", "warning", "info"]>;
        type: z.ZodString;
        message: z.ZodString;
        entityType: z.ZodString;
        entityId: z.ZodString;
        dueDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        entityType: string;
        entityId: string;
        message: string;
        severity: "info" | "critical" | "warning";
        dueDate?: string | undefined;
    }, {
        type: string;
        id: string;
        entityType: string;
        entityId: string;
        message: string;
        severity: "info" | "critical" | "warning";
        dueDate?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    summary: {
        totalVessels: number;
        compliantVessels: number;
        totalCrew: number;
        compliantCrew: number;
        expiringCertifications: number;
        pendingManifests: number;
        upcomingInspections: number;
    };
    recentActivity: {
        description: string;
        type: string;
        id: string;
        userName: string;
        timestamp: string;
        userId: string;
    }[];
    alerts: {
        type: string;
        id: string;
        entityType: string;
        entityId: string;
        message: string;
        severity: "info" | "critical" | "warning";
        dueDate?: string | undefined;
    }[];
}, {
    summary: {
        totalVessels: number;
        compliantVessels: number;
        totalCrew: number;
        compliantCrew: number;
        expiringCertifications: number;
        pendingManifests: number;
        upcomingInspections: number;
    };
    recentActivity: {
        description: string;
        type: string;
        id: string;
        userName: string;
        timestamp: string;
        userId: string;
    }[];
    alerts: {
        type: string;
        id: string;
        entityType: string;
        entityId: string;
        message: string;
        severity: "info" | "critical" | "warning";
        dueDate?: string | undefined;
    }[];
}>;
export type ComplianceDashboard = z.infer<typeof ComplianceDashboardSchema>;
export declare const ReportTypeEnum: z.ZodEnum<["PASSENGER_MANIFEST", "CREW_COMPLIANCE", "CERTIFICATION_STATUS", "SAFE_MANNING", "VESSEL_DOCUMENTS", "INSPECTION_HISTORY", "AUDIT_SUMMARY"]>;
export type ReportType = z.infer<typeof ReportTypeEnum>;
export declare const GenerateReportSchema: z.ZodObject<{
    type: z.ZodEnum<["PASSENGER_MANIFEST", "CREW_COMPLIANCE", "CERTIFICATION_STATUS", "SAFE_MANNING", "VESSEL_DOCUMENTS", "INSPECTION_HISTORY", "AUDIT_SUMMARY"]>;
    format: z.ZodEnum<["csv", "xlsx", "pdf", "xml"]>;
    jurisdiction: z.ZodOptional<z.ZodEnum<["bahamas", "jamaica", "barbados"]>>;
    vesselId: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    includeSignature: z.ZodOptional<z.ZodBoolean>;
    includeWatermark: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "PASSENGER_MANIFEST" | "CREW_COMPLIANCE" | "CERTIFICATION_STATUS" | "SAFE_MANNING" | "VESSEL_DOCUMENTS" | "INSPECTION_HISTORY" | "AUDIT_SUMMARY";
    format: "csv" | "xlsx" | "pdf" | "xml";
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    vesselId?: string | undefined;
    jurisdiction?: "bahamas" | "jamaica" | "barbados" | undefined;
    includeSignature?: boolean | undefined;
    includeWatermark?: boolean | undefined;
}, {
    type: "PASSENGER_MANIFEST" | "CREW_COMPLIANCE" | "CERTIFICATION_STATUS" | "SAFE_MANNING" | "VESSEL_DOCUMENTS" | "INSPECTION_HISTORY" | "AUDIT_SUMMARY";
    format: "csv" | "xlsx" | "pdf" | "xml";
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    vesselId?: string | undefined;
    jurisdiction?: "bahamas" | "jamaica" | "barbados" | undefined;
    includeSignature?: boolean | undefined;
    includeWatermark?: boolean | undefined;
}>;
export type GenerateReport = z.infer<typeof GenerateReportSchema>;
export declare const ComplianceReportSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["PASSENGER_MANIFEST", "CREW_COMPLIANCE", "CERTIFICATION_STATUS", "SAFE_MANNING", "VESSEL_DOCUMENTS", "INSPECTION_HISTORY", "AUDIT_SUMMARY"]>;
    typeName: z.ZodString;
    format: z.ZodEnum<["csv", "xlsx", "pdf", "xml"]>;
    jurisdiction: z.ZodEnum<["bahamas", "jamaica", "barbados"]>;
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    downloadUrl: z.ZodString;
    generatedAt: z.ZodString;
    generatedBy: z.ZodString;
    generatedByName: z.ZodString;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PASSENGER_MANIFEST" | "CREW_COMPLIANCE" | "CERTIFICATION_STATUS" | "SAFE_MANNING" | "VESSEL_DOCUMENTS" | "INSPECTION_HISTORY" | "AUDIT_SUMMARY";
    id: string;
    format: "csv" | "xlsx" | "pdf" | "xml";
    jurisdiction: "bahamas" | "jamaica" | "barbados";
    fileName: string;
    fileSize: number;
    typeName: string;
    downloadUrl: string;
    generatedAt: string;
    generatedBy: string;
    generatedByName: string;
    expiresAt: string;
}, {
    type: "PASSENGER_MANIFEST" | "CREW_COMPLIANCE" | "CERTIFICATION_STATUS" | "SAFE_MANNING" | "VESSEL_DOCUMENTS" | "INSPECTION_HISTORY" | "AUDIT_SUMMARY";
    id: string;
    format: "csv" | "xlsx" | "pdf" | "xml";
    jurisdiction: "bahamas" | "jamaica" | "barbados";
    fileName: string;
    fileSize: number;
    typeName: string;
    downloadUrl: string;
    generatedAt: string;
    generatedBy: string;
    generatedByName: string;
    expiresAt: string;
}>;
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;
export declare const InspectionSchema: z.ZodObject<{
    id: z.ZodString;
    vesselId: z.ZodString;
    vesselName: z.ZodString;
    type: z.ZodEnum<["PORT_STATE_CONTROL", "FLAG_STATE", "CLASS_SURVEY", "INTERNAL_AUDIT", "REGULATORY", "OTHER"]>;
    inspectingAuthority: z.ZodString;
    inspectorName: z.ZodOptional<z.ZodString>;
    scheduledDate: z.ZodString;
    completedDate: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["scheduled", "in_progress", "completed", "cancelled"]>;
    result: z.ZodOptional<z.ZodEnum<["passed", "passed_with_observations", "failed", "pending"]>>;
    deficiencies: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        description: z.ZodString;
        severity: z.ZodEnum<["major", "minor", "observation"]>;
        deadline: z.ZodOptional<z.ZodString>;
        resolved: z.ZodBoolean;
        resolvedDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        code: string;
        severity: "major" | "minor" | "observation";
        resolved: boolean;
        deadline?: string | undefined;
        resolvedDate?: string | undefined;
    }, {
        description: string;
        code: string;
        severity: "major" | "minor" | "observation";
        resolved: boolean;
        deadline?: string | undefined;
        resolvedDate?: string | undefined;
    }>, "many">>;
    reportUrl: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "OTHER" | "PORT_STATE_CONTROL" | "FLAG_STATE" | "CLASS_SURVEY" | "INTERNAL_AUDIT" | "REGULATORY";
    id: string;
    createdAt: string;
    updatedAt: string;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    vesselId: string;
    createdBy: string;
    vesselName: string;
    inspectingAuthority: string;
    scheduledDate: string;
    result?: "passed" | "passed_with_observations" | "failed" | "pending" | undefined;
    notes?: string | undefined;
    inspectorName?: string | undefined;
    completedDate?: string | undefined;
    deficiencies?: {
        description: string;
        code: string;
        severity: "major" | "minor" | "observation";
        resolved: boolean;
        deadline?: string | undefined;
        resolvedDate?: string | undefined;
    }[] | undefined;
    reportUrl?: string | undefined;
}, {
    type: "OTHER" | "PORT_STATE_CONTROL" | "FLAG_STATE" | "CLASS_SURVEY" | "INTERNAL_AUDIT" | "REGULATORY";
    id: string;
    createdAt: string;
    updatedAt: string;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    vesselId: string;
    createdBy: string;
    vesselName: string;
    inspectingAuthority: string;
    scheduledDate: string;
    result?: "passed" | "passed_with_observations" | "failed" | "pending" | undefined;
    notes?: string | undefined;
    inspectorName?: string | undefined;
    completedDate?: string | undefined;
    deficiencies?: {
        description: string;
        code: string;
        severity: "major" | "minor" | "observation";
        resolved: boolean;
        deadline?: string | undefined;
        resolvedDate?: string | undefined;
    }[] | undefined;
    reportUrl?: string | undefined;
}>;
export type Inspection = z.infer<typeof InspectionSchema>;
export declare const RecordInspectionSchema: z.ZodObject<{
    vesselId: z.ZodString;
    type: z.ZodEnum<["PORT_STATE_CONTROL", "FLAG_STATE", "CLASS_SURVEY", "INTERNAL_AUDIT", "REGULATORY", "OTHER"]>;
    inspectingAuthority: z.ZodString;
    inspectorName: z.ZodOptional<z.ZodString>;
    scheduledDate: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "OTHER" | "PORT_STATE_CONTROL" | "FLAG_STATE" | "CLASS_SURVEY" | "INTERNAL_AUDIT" | "REGULATORY";
    vesselId: string;
    inspectingAuthority: string;
    scheduledDate: string;
    notes?: string | undefined;
    inspectorName?: string | undefined;
}, {
    type: "OTHER" | "PORT_STATE_CONTROL" | "FLAG_STATE" | "CLASS_SURVEY" | "INTERNAL_AUDIT" | "REGULATORY";
    vesselId: string;
    inspectingAuthority: string;
    scheduledDate: string;
    notes?: string | undefined;
    inspectorName?: string | undefined;
}>;
export type RecordInspection = z.infer<typeof RecordInspectionSchema>;
