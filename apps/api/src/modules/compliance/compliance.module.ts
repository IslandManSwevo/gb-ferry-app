import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CBPModule } from '../cbp/cbp.module';
import { DatabaseModule } from '../database/database.module';
import { VesselsModule } from '../vessels/vessels.module';
import { ComplianceAdapterService } from './compliance-adapter.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { SafeManningEngine } from './safe-manning.engine';
import { STCWSubstitutionService } from './stcw-substitution.service';

@Module({
  imports: [DatabaseModule, AuditModule, CBPModule, VesselsModule],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    ComplianceAdapterService,
    SafeManningEngine,
    STCWSubstitutionService,
  ],
  exports: [
    ComplianceService,
    ComplianceAdapterService,
    SafeManningEngine,
    STCWSubstitutionService,
  ],
})
export class ComplianceModule {}
