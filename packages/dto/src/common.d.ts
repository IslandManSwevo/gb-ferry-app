import { z } from 'zod';
export declare const GenderEnum: z.ZodEnum<["M", "F", "X"]>;
export type Gender = z.infer<typeof GenderEnum>;
export declare const IdentityDocTypeEnum: z.ZodEnum<["PASSPORT", "SEAMAN_BOOK", "NATIONAL_ID", "TRAVEL_DOCUMENT"]>;
export type IdentityDocType = z.infer<typeof IdentityDocTypeEnum>;
export declare const NationalitySchema: z.ZodString;
export declare const FutureDateSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const PastDateSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type Pagination = z.infer<typeof PaginationSchema>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: T;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: T;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: T;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const PaginatedResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T) => z.ZodObject<{
    data: z.ZodArray<T, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}, {
    data: T["_input"][];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}>;
export declare const JurisdictionEnum: z.ZodEnum<["bahamas", "jamaica", "barbados"]>;
export type Jurisdiction = z.infer<typeof JurisdictionEnum>;
export declare const ExportFormatEnum: z.ZodEnum<["csv", "xlsx", "pdf", "xml"]>;
export type ExportFormat = z.infer<typeof ExportFormatEnum>;
