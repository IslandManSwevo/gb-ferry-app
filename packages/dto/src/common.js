"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportFormatEnum = exports.JurisdictionEnum = exports.PaginatedResponseSchema = exports.ApiResponseSchema = exports.PaginationSchema = exports.PastDateSchema = exports.FutureDateSchema = exports.NationalitySchema = exports.IdentityDocTypeEnum = exports.GenderEnum = void 0;
const zod_1 = require("zod");
exports.GenderEnum = zod_1.z.enum(['M', 'F', 'X']);
exports.IdentityDocTypeEnum = zod_1.z.enum([
    'PASSPORT',
    'SEAMAN_BOOK',
    'NATIONAL_ID',
    'TRAVEL_DOCUMENT',
]);
exports.NationalitySchema = zod_1.z.string().length(3).toUpperCase();
exports.FutureDateSchema = zod_1.z.string().refine((date) => new Date(date) > new Date(), { message: 'Date must be in the future' });
exports.PastDateSchema = zod_1.z.string().refine((date) => new Date(date) < new Date(), { message: 'Date must be in the past' });
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(100).default(20),
});
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    data: dataSchema,
    message: zod_1.z.string().optional(),
    timestamp: zod_1.z.string(),
});
exports.ApiResponseSchema = ApiResponseSchema;
const PaginatedResponseSchema = (itemSchema) => zod_1.z.object({
    data: zod_1.z.array(itemSchema),
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    limit: zod_1.z.number(),
    totalPages: zod_1.z.number(),
});
exports.PaginatedResponseSchema = PaginatedResponseSchema;
exports.JurisdictionEnum = zod_1.z.enum(['bahamas', 'jamaica', 'barbados']);
exports.ExportFormatEnum = zod_1.z.enum(['csv', 'xlsx', 'pdf', 'xml']);
//# sourceMappingURL=common.js.map