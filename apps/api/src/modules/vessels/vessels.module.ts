import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { VesselCertificateService } from './vessel-certificate.service';
import { VesselsController } from './vessels.controller';
import { VesselsService } from './vessels.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [VesselsController],
  providers: [VesselsService, VesselCertificateService],
  exports: [VesselsService, VesselCertificateService],
})
export class VesselsModule {}
