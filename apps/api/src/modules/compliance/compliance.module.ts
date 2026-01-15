import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CBPModule } from '../cbp/cbp.module';
import { DatabaseModule } from '../database/database.module';
import { USCGModule } from '../uscg/uscg.module';
import { ComplianceAdapterService } from './compliance-adapter.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { MultiJurisdictionComplianceService } from './multi-jurisdiction.service';

@Module({
  imports: [DatabaseModule, AuditModule, CBPModule, USCGModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, ComplianceAdapterService, MultiJurisdictionComplianceService],
  exports: [ComplianceService, ComplianceAdapterService, MultiJurisdictionComplianceService],
})
export class ComplianceModule {}
