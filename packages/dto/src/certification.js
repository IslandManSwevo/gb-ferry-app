"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCrewCertifications = exports.ROLE_CERTIFICATION_REQUIREMENTS = exports.CertificationFiltersSchema = exports.CertificationSchema = exports.CreateCertificationSchema = exports.CertificationStatusEnum = exports.STCWCertTypeEnum = void 0;
const zod_1 = require("zod");
exports.STCWCertTypeEnum = zod_1.z.enum([
    'MASTER',
    'CHIEF_MATE',
    'OFFICER_OF_THE_WATCH_DECK',
    'RATING_FORMING_PART_OF_NAVIGATIONAL_WATCH',
    'ABLE_SEAFARER_DECK',
    'CHIEF_ENGINEER',
    'SECOND_ENGINEER',
    'OFFICER_OF_THE_WATCH_ENGINE',
    'RATING_FORMING_PART_OF_ENGINE_WATCH',
    'ABLE_SEAFARER_ENGINE',
    'ELECTRO_TECHNICAL_OFFICER',
    'GMDSS_GOC',
    'GMDSS_ROC',
    'TANKER_FAMILIARIZATION',
    'OIL_TANKER_CARGO',
    'CHEMICAL_TANKER_CARGO',
    'LIQUEFIED_GAS_TANKER_CARGO',
    'PASSENGER_SHIP_CROWD_MANAGEMENT',
    'PASSENGER_SHIP_CRISIS_MANAGEMENT',
    'PASSENGER_SHIP_SAFETY',
    'BASIC_SAFETY_TRAINING',
    'SURVIVAL_CRAFT',
    'ADVANCED_FIREFIGHTING',
    'MEDICAL_FIRST_AID',
    'MEDICAL_CARE',
    'SECURITY_AWARENESS',
    'SHIP_SECURITY_OFFICER',
    'ENDORSEMENT',
    'OTHER',
]);
exports.CertificationStatusEnum = zod_1.z.enum([
    'valid',
    'expiring',
    'expired',
    'revoked',
    'pending_verification',
]);
exports.CreateCertificationSchema = zod_1.z.object({
    crewId: zod_1.z.string().uuid(),
    type: exports.STCWCertTypeEnum,
    certificateNumber: zod_1.z.string().min(1).max(100),
    issuingAuthority: zod_1.z.string().min(1).max(200),
    issuingCountry: zod_1.z.string().length(3),
    issueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expiryDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    documentUrl: zod_1.z.string().url().optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.CertificationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    crewId: zod_1.z.string().uuid(),
    crewName: zod_1.z.string(),
    type: exports.STCWCertTypeEnum,
    typeName: zod_1.z.string(),
    certificateNumber: zod_1.z.string(),
    issuingAuthority: zod_1.z.string(),
    issuingCountry: zod_1.z.string(),
    issueDate: zod_1.z.string(),
    expiryDate: zod_1.z.string(),
    daysUntilExpiry: zod_1.z.number(),
    status: exports.CertificationStatusEnum,
    documentUrl: zod_1.z.string().nullable(),
    documentVerified: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    verifiedAt: zod_1.z.string().nullable(),
    verifiedBy: zod_1.z.string().uuid().nullable(),
});
exports.CertificationFiltersSchema = zod_1.z.object({
    crewId: zod_1.z.string().uuid().optional(),
    type: exports.STCWCertTypeEnum.optional(),
    status: exports.CertificationStatusEnum.optional(),
    expiringWithinDays: zod_1.z.number().min(1).max(365).optional(),
});
exports.ROLE_CERTIFICATION_REQUIREMENTS = {
    MASTER: [
        'MASTER',
        'BASIC_SAFETY_TRAINING',
        'SURVIVAL_CRAFT',
        'ADVANCED_FIREFIGHTING',
        'MEDICAL_CARE',
        'GMDSS_GOC',
        'PASSENGER_SHIP_CROWD_MANAGEMENT',
        'PASSENGER_SHIP_CRISIS_MANAGEMENT',
        'SECURITY_AWARENESS',
        'SHIP_SECURITY_OFFICER',
    ],
    CHIEF_OFFICER: [
        'CHIEF_MATE',
        'BASIC_SAFETY_TRAINING',
        'SURVIVAL_CRAFT',
        'ADVANCED_FIREFIGHTING',
        'MEDICAL_FIRST_AID',
        'GMDSS_GOC',
        'PASSENGER_SHIP_CROWD_MANAGEMENT',
        'SECURITY_AWARENESS',
    ],
    DECK_OFFICER: [
        'OFFICER_OF_THE_WATCH_DECK',
        'BASIC_SAFETY_TRAINING',
        'GMDSS_ROC',
        'PASSENGER_SHIP_CROWD_MANAGEMENT',
        'SECURITY_AWARENESS',
    ],
    CHIEF_ENGINEER: [
        'CHIEF_ENGINEER',
        'BASIC_SAFETY_TRAINING',
        'ADVANCED_FIREFIGHTING',
        'MEDICAL_FIRST_AID',
    ],
    ENGINE_OFFICER: ['OFFICER_OF_THE_WATCH_ENGINE', 'BASIC_SAFETY_TRAINING', 'ADVANCED_FIREFIGHTING'],
    ABLE_SEAMAN: [
        'ABLE_SEAFARER_DECK',
        'BASIC_SAFETY_TRAINING',
        'PASSENGER_SHIP_SAFETY',
        'SECURITY_AWARENESS',
    ],
    RATING: ['BASIC_SAFETY_TRAINING', 'PASSENGER_SHIP_SAFETY', 'SECURITY_AWARENESS'],
};
const validateCrewCertifications = (role, certifications, sailingDate) => {
    const required = exports.ROLE_CERTIFICATION_REQUIREMENTS[role] || [];
    const validCerts = certifications.filter((c) => new Date(c.expiryDate) >= sailingDate);
    const validCertTypes = new Set(validCerts.map((c) => c.type));
    const missing = required.filter((r) => !validCertTypes.has(r));
    const expired = certifications
        .filter((c) => new Date(c.expiryDate) < sailingDate)
        .map((c) => c.type);
    return {
        valid: missing.length === 0 && expired.length === 0,
        missing,
        expired,
    };
};
exports.validateCrewCertifications = validateCrewCertifications;
//# sourceMappingURL=certification.js.map