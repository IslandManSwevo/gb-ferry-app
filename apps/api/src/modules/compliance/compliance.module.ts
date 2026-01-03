import { Module } from '@nestjs/common';
import { ComplianceAdapterService } from './compliance-adapter.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, ComplianceAdapterService],
  exports: [ComplianceService, ComplianceAdapterService],
})
export class ComplianceModule {}
