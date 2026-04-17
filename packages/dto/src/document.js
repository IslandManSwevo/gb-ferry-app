"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentMetadataSchema = exports.DocumentUploadDtoSchema = void 0;
const zod_1 = require("zod");
exports.DocumentUploadDtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    entityType: zod_1.z.enum(['vessel', 'crew', 'company']),
    entityId: zod_1.z.string().uuid(),
    documentType: zod_1.z.string().optional(),
    expiryDate: zod_1.z.coerce.date().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.DocumentMetadataSchema = zod_1.z.object({
    detectedType: zod_1.z.string().optional(),
    extractedExpiryDate: zod_1.z.coerce.date().optional(),
    certificateNumber: zod_1.z.string().optional(),
    issuingAuthority: zod_1.z.string().optional(),
    confidence: zod_1.z.number().min(0).max(1),
});
//# sourceMappingURL=document.js.map