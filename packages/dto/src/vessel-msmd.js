"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertVesselMSMDSchema = void 0;
const zod_1 = require("zod");
exports.UpsertVesselMSMDSchema = zod_1.z.object({
    msmdReferenceNumber: zod_1.z.string().min(1),
    issueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expiryDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    masterRequired: zod_1.z.number().int().min(0),
    chiefOfficerRequired: zod_1.z.number().int().min(0),
    deckOfficerRequired: zod_1.z.number().int().min(0),
    chiefEngineerRequired: zod_1.z.number().int().min(0),
    engineerOfficerRequired: zod_1.z.number().int().min(0),
    ratingsDeckRequired: zod_1.z.number().int().min(0),
    ratingsEngineRequired: zod_1.z.number().int().min(0),
    securityOfficerRequired: zod_1.z.number().int().min(0),
    radioOperatorRequired: zod_1.z.number().int().min(0),
    cookRequired: zod_1.z.number().int().min(0),
    crowdControlRequired: zod_1.z.number().int().min(0),
    maxPassengersForManning: zod_1.z.number().int().min(0).optional(),
    operationalArea: zod_1.z.string().optional(),
});
//# sourceMappingURL=vessel-msmd.js.map