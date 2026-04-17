import { z } from 'zod';
export declare const VesselTypeEnum: z.ZodEnum<["PASSENGER_FERRY", "RO_RO_PASSENGER", "HIGH_SPEED_CRAFT", "CARGO", "TANKER", "OTHER"]>;
export type VesselType = z.infer<typeof VesselTypeEnum>;
export declare const VesselDocumentTypeEnum: z.ZodEnum<["CERTIFICATE_OF_REGISTRY", "DECLARATION_OF_OWNERSHIP", "MANAGING_OWNER_REGISTRATION", "AUTHORIZED_OFFICER_APPOINTMENT", "SAFETY_MANAGEMENT_CERTIFICATE", "DOCUMENT_OF_COMPLIANCE", "PASSENGER_SHIP_SAFETY_CERTIFICATE", "MINIMUM_SAFE_MANNING_DOCUMENT", "INTERNATIONAL_TONNAGE_CERTIFICATE", "LOAD_LINE_CERTIFICATE", "P_AND_I_INSURANCE", "HULL_INSURANCE", "WET_LEASE_AGREEMENT", "DRY_LEASE_AGREEMENT", "BAREBOAT_CHARTER", "CLASS_CERTIFICATE", "OTHER"]>;
export type VesselDocumentType = z.infer<typeof VesselDocumentTypeEnum>;
export declare const OwnerInfoSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["individual", "company"]>;
    address: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        country: string;
        state?: string | undefined;
        postalCode?: string | undefined;
    }, {
        street: string;
        city: string;
        country: string;
        state?: string | undefined;
        postalCode?: string | undefined;
    }>;
    contactEmail: z.ZodString;
    contactPhone: z.ZodString;
    registrationNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "individual" | "company";
    name: string;
    address: {
        street: string;
        city: string;
        country: string;
        state?: string | undefined;
        postalCode?: string | undefined;
    };
    contactEmail: string;
    contactPhone: string;
    registrationNumber?: string | undefined;
}, {
    type: "individual" | "company";
    name: string;
    address: {
        street: string;
        city: string;
        country: string;
        state?: string | undefined;
        postalCode?: string | undefined;
    };
    contactEmail: string;
    contactPhone: string;
    registrationNumber?: string | undefined;
}>;
export type OwnerInfo = z.infer<typeof OwnerInfoSchema>;
export declare const CreateVesselSchema: z.ZodObject<{
    name: z.ZodString;
    imoNumber: z.ZodString;
    officialNumber: z.ZodOptional<z.ZodString>;
    callSign: z.ZodOptional<z.ZodString>;
    mmsi: z.ZodOptional<z.ZodString>;
    flagState: z.ZodDefault<z.ZodString>;
    portOfRegistry: z.ZodDefault<z.ZodString>;
    type: z.ZodEnum<["PASSENGER_FERRY", "RO_RO_PASSENGER", "HIGH_SPEED_CRAFT", "CARGO", "TANKER", "OTHER"]>;
    classificationSociety: z.ZodOptional<z.ZodString>;
    classNotation: z.ZodOptional<z.ZodString>;
    grossTonnage: z.ZodNumber;
    netTonnage: z.ZodNumber;
    lengthOverall: z.ZodNumber;
    breadth: z.ZodOptional<z.ZodNumber>;
    depth: z.ZodOptional<z.ZodNumber>;
    passengerCapacity: z.ZodOptional<z.ZodNumber>;
    crewCapacity: z.ZodOptional<z.ZodNumber>;
    vehicleCapacity: z.ZodOptional<z.ZodNumber>;
    engineType: z.ZodOptional<z.ZodString>;
    engineCount: z.ZodOptional<z.ZodNumber>;
    propulsionPower: z.ZodOptional<z.ZodNumber>;
    registeredOwner: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["individual", "company"]>;
        address: z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        }, {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        }>;
        contactEmail: z.ZodString;
        contactPhone: z.ZodString;
        registrationNumber: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    }, {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    }>;
    managingOwner: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["individual", "company"]>;
        address: z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        }, {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        }>;
        contactEmail: z.ZodString;
        contactPhone: z.ZodString;
        registrationNumber: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    }, {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    }>>;
    yearBuilt: z.ZodNumber;
    builder: z.ZodOptional<z.ZodString>;
    buildCountry: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "PASSENGER_FERRY" | "RO_RO_PASSENGER" | "HIGH_SPEED_CRAFT" | "CARGO" | "TANKER" | "OTHER";
    name: string;
    imoNumber: string;
    flagState: string;
    portOfRegistry: string;
    grossTonnage: number;
    netTonnage: number;
    lengthOverall: number;
    yearBuilt: number;
    registeredOwner: {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    };
    officialNumber?: string | undefined;
    callSign?: string | undefined;
    mmsi?: string | undefined;
    classificationSociety?: string | undefined;
    classNotation?: string | undefined;
    breadth?: number | undefined;
    depth?: number | undefined;
    passengerCapacity?: number | undefined;
    crewCapacity?: number | undefined;
    vehicleCapacity?: number | undefined;
    engineType?: string | undefined;
    engineCount?: number | undefined;
    propulsionPower?: number | undefined;
    builder?: string | undefined;
    buildCountry?: string | undefined;
    managingOwner?: {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    } | undefined;
}, {
    type: "PASSENGER_FERRY" | "RO_RO_PASSENGER" | "HIGH_SPEED_CRAFT" | "CARGO" | "TANKER" | "OTHER";
    name: string;
    imoNumber: string;
    grossTonnage: number;
    netTonnage: number;
    lengthOverall: number;
    yearBuilt: number;
    registeredOwner: {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    };
    officialNumber?: string | undefined;
    callSign?: string | undefined;
    mmsi?: string | undefined;
    flagState?: string | undefined;
    portOfRegistry?: string | undefined;
    classificationSociety?: string | undefined;
    classNotation?: string | undefined;
    breadth?: number | undefined;
    depth?: number | undefined;
    passengerCapacity?: number | undefined;
    crewCapacity?: number | undefined;
    vehicleCapacity?: number | undefined;
    engineType?: string | undefined;
    engineCount?: number | undefined;
    propulsionPower?: number | undefined;
    builder?: string | undefined;
    buildCountry?: string | undefined;
    managingOwner?: {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    } | undefined;
}>;
export type CreateVessel = z.infer<typeof CreateVesselSchema>;
export declare const VesselSchema: z.ZodObject<{
    status: z.ZodEnum<["active", "inactive", "laid_up", "sold"]>;
    complianceStatus: z.ZodObject<{
        safeManningCompliant: z.ZodBoolean;
        documentsValid: z.ZodBoolean;
        insuranceValid: z.ZodBoolean;
        certificatesValid: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        safeManningCompliant: boolean;
        documentsValid: boolean;
        insuranceValid: boolean;
        certificatesValid: boolean;
    }, {
        safeManningCompliant: boolean;
        documentsValid: boolean;
        insuranceValid: boolean;
        certificatesValid: boolean;
    }>;
    documentCount: z.ZodNumber;
    expiringDocumentsCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    name: z.ZodString;
    imoNumber: z.ZodString;
    officialNumber: z.ZodOptional<z.ZodString>;
    callSign: z.ZodOptional<z.ZodString>;
    mmsi: z.ZodOptional<z.ZodString>;
    flagState: z.ZodDefault<z.ZodString>;
    portOfRegistry: z.ZodDefault<z.ZodString>;
    type: z.ZodEnum<["PASSENGER_FERRY", "RO_RO_PASSENGER", "HIGH_SPEED_CRAFT", "CARGO", "TANKER", "OTHER"]>;
    classificationSociety: z.ZodOptional<z.ZodString>;
    classNotation: z.ZodOptional<z.ZodString>;
    grossTonnage: z.ZodNumber;
    netTonnage: z.ZodNumber;
    lengthOverall: z.ZodNumber;
    breadth: z.ZodOptional<z.ZodNumber>;
    depth: z.ZodOptional<z.ZodNumber>;
    passengerCapacity: z.ZodOptional<z.ZodNumber>;
    crewCapacity: z.ZodOptional<z.ZodNumber>;
    vehicleCapacity: z.ZodOptional<z.ZodNumber>;
    engineType: z.ZodOptional<z.ZodString>;
    engineCount: z.ZodOptional<z.ZodNumber>;
    propulsionPower: z.ZodOptional<z.ZodNumber>;
    registeredOwner: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["individual", "company"]>;
        address: z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        }, {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        }>;
        contactEmail: z.ZodString;
        contactPhone: z.ZodString;
        registrationNumber: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    }, {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    }>;
    managingOwner: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["individual", "company"]>;
        address: z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        }, {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        }>;
        contactEmail: z.ZodString;
        contactPhone: z.ZodString;
        registrationNumber: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    }, {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    }>>;
    yearBuilt: z.ZodNumber;
    builder: z.ZodOptional<z.ZodString>;
    buildCountry: z.ZodOptional<z.ZodString>;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "PASSENGER_FERRY" | "RO_RO_PASSENGER" | "HIGH_SPEED_CRAFT" | "CARGO" | "TANKER" | "OTHER";
    name: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    imoNumber: string;
    flagState: string;
    portOfRegistry: string;
    grossTonnage: number;
    netTonnage: number;
    lengthOverall: number;
    yearBuilt: number;
    status: "active" | "inactive" | "laid_up" | "sold";
    complianceStatus: {
        safeManningCompliant: boolean;
        documentsValid: boolean;
        insuranceValid: boolean;
        certificatesValid: boolean;
    };
    registeredOwner: {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    };
    documentCount: number;
    expiringDocumentsCount: number;
    officialNumber?: string | undefined;
    callSign?: string | undefined;
    mmsi?: string | undefined;
    classificationSociety?: string | undefined;
    classNotation?: string | undefined;
    breadth?: number | undefined;
    depth?: number | undefined;
    passengerCapacity?: number | undefined;
    crewCapacity?: number | undefined;
    vehicleCapacity?: number | undefined;
    engineType?: string | undefined;
    engineCount?: number | undefined;
    propulsionPower?: number | undefined;
    builder?: string | undefined;
    buildCountry?: string | undefined;
    managingOwner?: {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    } | undefined;
}, {
    type: "PASSENGER_FERRY" | "RO_RO_PASSENGER" | "HIGH_SPEED_CRAFT" | "CARGO" | "TANKER" | "OTHER";
    name: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    imoNumber: string;
    grossTonnage: number;
    netTonnage: number;
    lengthOverall: number;
    yearBuilt: number;
    status: "active" | "inactive" | "laid_up" | "sold";
    complianceStatus: {
        safeManningCompliant: boolean;
        documentsValid: boolean;
        insuranceValid: boolean;
        certificatesValid: boolean;
    };
    registeredOwner: {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    };
    documentCount: number;
    expiringDocumentsCount: number;
    officialNumber?: string | undefined;
    callSign?: string | undefined;
    mmsi?: string | undefined;
    flagState?: string | undefined;
    portOfRegistry?: string | undefined;
    classificationSociety?: string | undefined;
    classNotation?: string | undefined;
    breadth?: number | undefined;
    depth?: number | undefined;
    passengerCapacity?: number | undefined;
    crewCapacity?: number | undefined;
    vehicleCapacity?: number | undefined;
    engineType?: string | undefined;
    engineCount?: number | undefined;
    propulsionPower?: number | undefined;
    builder?: string | undefined;
    buildCountry?: string | undefined;
    managingOwner?: {
        type: "individual" | "company";
        name: string;
        address: {
            street: string;
            city: string;
            country: string;
            state?: string | undefined;
            postalCode?: string | undefined;
        };
        contactEmail: string;
        contactPhone: string;
        registrationNumber?: string | undefined;
    } | undefined;
}>;
export type Vessel = z.infer<typeof VesselSchema>;
export declare const VesselDocumentSchema: z.ZodObject<{
    id: z.ZodString;
    vesselId: z.ZodString;
    type: z.ZodEnum<["CERTIFICATE_OF_REGISTRY", "DECLARATION_OF_OWNERSHIP", "MANAGING_OWNER_REGISTRATION", "AUTHORIZED_OFFICER_APPOINTMENT", "SAFETY_MANAGEMENT_CERTIFICATE", "DOCUMENT_OF_COMPLIANCE", "PASSENGER_SHIP_SAFETY_CERTIFICATE", "MINIMUM_SAFE_MANNING_DOCUMENT", "INTERNATIONAL_TONNAGE_CERTIFICATE", "LOAD_LINE_CERTIFICATE", "P_AND_I_INSURANCE", "HULL_INSURANCE", "WET_LEASE_AGREEMENT", "DRY_LEASE_AGREEMENT", "BAREBOAT_CHARTER", "CLASS_CERTIFICATE", "OTHER"]>;
    typeName: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    mimeType: z.ZodString;
    documentUrl: z.ZodString;
    issueDate: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodString>;
    daysUntilExpiry: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<["valid", "expiring", "expired", "pending_review"]>;
    verified: z.ZodBoolean;
    uploadedAt: z.ZodString;
    uploadedBy: z.ZodString;
    verifiedAt: z.ZodNullable<z.ZodString>;
    verifiedBy: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "OTHER" | "CERTIFICATE_OF_REGISTRY" | "DECLARATION_OF_OWNERSHIP" | "MANAGING_OWNER_REGISTRATION" | "AUTHORIZED_OFFICER_APPOINTMENT" | "SAFETY_MANAGEMENT_CERTIFICATE" | "DOCUMENT_OF_COMPLIANCE" | "PASSENGER_SHIP_SAFETY_CERTIFICATE" | "MINIMUM_SAFE_MANNING_DOCUMENT" | "INTERNATIONAL_TONNAGE_CERTIFICATE" | "LOAD_LINE_CERTIFICATE" | "P_AND_I_INSURANCE" | "HULL_INSURANCE" | "WET_LEASE_AGREEMENT" | "DRY_LEASE_AGREEMENT" | "BAREBOAT_CHARTER" | "CLASS_CERTIFICATE";
    id: string;
    status: "valid" | "expiring" | "expired" | "pending_review";
    vesselId: string;
    fileName: string;
    fileSize: number;
    documentUrl: string;
    typeName: string;
    title: string;
    mimeType: string;
    daysUntilExpiry: number | null;
    verified: boolean;
    uploadedAt: string;
    uploadedBy: string;
    verifiedAt: string | null;
    verifiedBy: string | null;
    description?: string | undefined;
    issueDate?: string | undefined;
    expiryDate?: string | undefined;
}, {
    type: "OTHER" | "CERTIFICATE_OF_REGISTRY" | "DECLARATION_OF_OWNERSHIP" | "MANAGING_OWNER_REGISTRATION" | "AUTHORIZED_OFFICER_APPOINTMENT" | "SAFETY_MANAGEMENT_CERTIFICATE" | "DOCUMENT_OF_COMPLIANCE" | "PASSENGER_SHIP_SAFETY_CERTIFICATE" | "MINIMUM_SAFE_MANNING_DOCUMENT" | "INTERNATIONAL_TONNAGE_CERTIFICATE" | "LOAD_LINE_CERTIFICATE" | "P_AND_I_INSURANCE" | "HULL_INSURANCE" | "WET_LEASE_AGREEMENT" | "DRY_LEASE_AGREEMENT" | "BAREBOAT_CHARTER" | "CLASS_CERTIFICATE";
    id: string;
    status: "valid" | "expiring" | "expired" | "pending_review";
    vesselId: string;
    fileName: string;
    fileSize: number;
    documentUrl: string;
    typeName: string;
    title: string;
    mimeType: string;
    daysUntilExpiry: number | null;
    verified: boolean;
    uploadedAt: string;
    uploadedBy: string;
    verifiedAt: string | null;
    verifiedBy: string | null;
    description?: string | undefined;
    issueDate?: string | undefined;
    expiryDate?: string | undefined;
}>;
export type VesselDocument = z.infer<typeof VesselDocumentSchema>;
export declare const SafeManningRequirementSchema: z.ZodObject<{
    vesselId: z.ZodString;
    documentNumber: z.ZodString;
    issueDate: z.ZodString;
    expiryDate: z.ZodOptional<z.ZodString>;
    issuingAuthority: z.ZodDefault<z.ZodString>;
    requirements: z.ZodArray<z.ZodObject<{
        role: z.ZodString;
        minimumCount: z.ZodNumber;
        certificateRequired: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        role: string;
        minimumCount: number;
        certificateRequired: string;
        notes?: string | undefined;
    }, {
        role: string;
        minimumCount: number;
        certificateRequired: string;
        notes?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    vesselId: string;
    issuingAuthority: string;
    issueDate: string;
    documentNumber: string;
    requirements: {
        role: string;
        minimumCount: number;
        certificateRequired: string;
        notes?: string | undefined;
    }[];
    expiryDate?: string | undefined;
}, {
    vesselId: string;
    issueDate: string;
    documentNumber: string;
    requirements: {
        role: string;
        minimumCount: number;
        certificateRequired: string;
        notes?: string | undefined;
    }[];
    issuingAuthority?: string | undefined;
    expiryDate?: string | undefined;
}>;
export type SafeManningRequirement = z.infer<typeof SafeManningRequirementSchema>;
