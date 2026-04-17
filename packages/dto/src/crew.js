"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCrewMember = exports.CrewRosterSchema = exports.CrewMemberSchema = exports.CreateCrewMemberSchema = exports.MedicalCertificateSchema = exports.CrewIdentitySchema = exports.CrewRoleEnum = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.CrewRoleEnum = zod_1.z.enum([
    'MASTER',
    'CHIEF_OFFICER',
    'SECOND_OFFICER',
    'THIRD_OFFICER',
    'DECK_OFFICER',
    'CHIEF_ENGINEER',
    'SECOND_ENGINEER',
    'THIRD_ENGINEER',
    'ENGINE_OFFICER',
    'ELECTRO_TECHNICAL_OFFICER',
    'ABLE_SEAMAN',
    'ORDINARY_SEAMAN',
    'RATING',
    'CADET',
    'CHIEF_STEWARD',
    'STEWARD',
    'COOK',
    'CHIEF_COOK',
    'PURSER',
    'SAFETY_OFFICER',
    'SHIP_SECURITY_OFFICER',
    'SECURITY_OFFICER',
    'RADIO_OPERATOR',
    'CROWD_CONTROL',
    'OTHER',
]);
exports.CrewIdentitySchema = zod_1.z.object({
    familyName: zod_1.z.string().min(1).max(100),
    givenNames: zod_1.z.string().min(1).max(100),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    placeOfBirth: zod_1.z.string().max(100).optional(),
    nationality: common_1.NationalitySchema,
    gender: common_1.GenderEnum,
    photographUrl: zod_1.z.string().url().optional(),
    passportNumber: zod_1.z.string().min(1).max(50),
    passportIssuingCountry: common_1.NationalitySchema,
    passportExpiryDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    seamanBookNumber: zod_1.z.string().max(50).optional(),
    seamanBookIssuingAuthority: zod_1.z.string().max(100).optional(),
});
exports.MedicalCertificateSchema = zod_1.z.object({
    type: zod_1.z.enum([
        'ENG_1',
        'PEME',
        'ILO_MLC',
        'OTHER',
    ]),
    issuingAuthority: zod_1.z.string(),
    issueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expiryDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    documentUrl: zod_1.z.string().url().optional(),
});
exports.CreateCrewMemberSchema = zod_1.z.object({
    ...exports.CrewIdentitySchema.shape,
    role: exports.CrewRoleEnum,
    vesselId: zod_1.z.string().uuid().optional(),
    medicalCertificate: exports.MedicalCertificateSchema.optional(),
    employmentStartDate: zod_1.z.string().optional(),
    contractType: zod_1.z.enum(['permanent', 'contract', 'temporary']).optional(),
});
exports.CrewMemberSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    ...exports.CrewIdentitySchema.shape,
    role: exports.CrewRoleEnum,
    vesselId: zod_1.z.string().uuid().nullable(),
    vesselName: zod_1.z.string().nullable(),
    medicalCertificate: exports.MedicalCertificateSchema.nullable(),
    complianceStatus: zod_1.z.enum(['compliant', 'expiring', 'expired', 'incomplete']),
    expiringCertificationsCount: zod_1.z.number(),
    status: zod_1.z.enum(['active', 'inactive', 'on_leave']),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.CrewRosterSchema = zod_1.z.object({
    vesselId: zod_1.z.string().uuid(),
    vesselName: zod_1.z.string(),
    crew: zod_1.z.array(exports.CrewMemberSchema),
    safeManningRequired: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    safeManningActual: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    compliant: zod_1.z.boolean(),
    discrepancies: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.string(),
        required: zod_1.z.number(),
        actual: zod_1.z.number(),
        message: zod_1.z.string(),
    })),
});
const validateCrewMember = (crew, sailingDate) => {
    const errors = [];
    const passportExpiry = new Date(crew.passportExpiryDate);
    if (passportExpiry < sailingDate) {
        errors.push('Passport expired');
    }
    if (crew.medicalCertificate) {
        const medicalExpiry = new Date(crew.medicalCertificate.expiryDate);
        if (medicalExpiry < sailingDate) {
            errors.push('Medical certificate expired');
        }
    }
    else {
        errors.push('Medical certificate required');
    }
    return errors;
};
exports.validateCrewMember = validateCrewMember;
//# sourceMappingURL=crew.js.map