"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VesselType = exports.VesselStatus = exports.VesselCertificateType = exports.VesselCertificateStatus = exports.InspectionType = exports.InspectionStatus = exports.InspectionResult = exports.Gender = exports.DocumentStatus = exports.CrewStatus = exports.CrewRole = exports.CertificationType = exports.CertificationStatus = exports.CbpSubmissionStatus = exports.AuditAction = exports.PrismaClient = exports.PrismaService = exports.prisma = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_1.PrismaClient; } });
const prismaClientOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};
exports.prisma = global.prisma ?? new client_1.PrismaClient(prismaClientOptions);
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super(prismaClientOptions);
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
var client_2 = require("@prisma/client");
Object.defineProperty(exports, "AuditAction", { enumerable: true, get: function () { return client_2.AuditAction; } });
Object.defineProperty(exports, "CbpSubmissionStatus", { enumerable: true, get: function () { return client_2.CbpSubmissionStatus; } });
Object.defineProperty(exports, "CertificationStatus", { enumerable: true, get: function () { return client_2.CertificationStatus; } });
Object.defineProperty(exports, "CertificationType", { enumerable: true, get: function () { return client_2.CertificationType; } });
Object.defineProperty(exports, "CrewRole", { enumerable: true, get: function () { return client_2.CrewRole; } });
Object.defineProperty(exports, "CrewStatus", { enumerable: true, get: function () { return client_2.CrewStatus; } });
Object.defineProperty(exports, "DocumentStatus", { enumerable: true, get: function () { return client_2.DocumentStatus; } });
Object.defineProperty(exports, "Gender", { enumerable: true, get: function () { return client_2.Gender; } });
Object.defineProperty(exports, "InspectionResult", { enumerable: true, get: function () { return client_2.InspectionResult; } });
Object.defineProperty(exports, "InspectionStatus", { enumerable: true, get: function () { return client_2.InspectionStatus; } });
Object.defineProperty(exports, "InspectionType", { enumerable: true, get: function () { return client_2.InspectionType; } });
Object.defineProperty(exports, "VesselCertificateStatus", { enumerable: true, get: function () { return client_2.VesselCertificateStatus; } });
Object.defineProperty(exports, "VesselCertificateType", { enumerable: true, get: function () { return client_2.VesselCertificateType; } });
Object.defineProperty(exports, "VesselStatus", { enumerable: true, get: function () { return client_2.VesselStatus; } });
Object.defineProperty(exports, "VesselType", { enumerable: true, get: function () { return client_2.VesselType; } });
//# sourceMappingURL=client.js.map