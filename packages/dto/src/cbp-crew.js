"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CbpI418ManifestDtoSchema = exports.USCbpCrewMemberDtoSchema = void 0;
const zod_1 = require("zod");
const crew_1 = require("./crew");
const vessel_1 = require("./vessel");
exports.USCbpCrewMemberDtoSchema = crew_1.CrewMemberSchema.extend({
    alienRegistrationNumber: zod_1.z.string().optional(),
    usVisaNumber: zod_1.z.string().optional(),
    usVisaType: zod_1.z.enum(['B1', 'B2', 'B1/B2', 'D', 'C1/D']).optional(),
    usVisaExpiry: zod_1.z.coerce.date().optional(),
    pscStatus: zod_1.z.enum(['CLEAR', 'NOTED', 'DETAINED']).optional(),
    passportCountry: zod_1.z.string().length(3),
    passportExpiry: zod_1.z.coerce.date().min(new Date(), { message: 'Passport must be valid' }),
});
exports.CbpI418ManifestDtoSchema = zod_1.z.object({
    submissionId: zod_1.z.string().uuid().optional(),
    vessel: vessel_1.VesselSchema,
    crewMembers: zod_1.z.array(exports.USCbpCrewMemberDtoSchema),
    arrivalPort: zod_1.z.enum(['2704']),
    departurePort: zod_1.z.string(),
    eta: zod_1.z.coerce.date(),
    etd: zod_1.z.coerce.date(),
    voyageNumber: zod_1.z.string(),
    status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED']),
    submittedAt: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=cbp-crew.js.map