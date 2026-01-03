import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { ComplianceAdapterService } from './compliance-adapter.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, ComplianceAdapterService],
  exports: [ComplianceService, ComplianceAdapterService],
})
export class ComplianceModule {}
