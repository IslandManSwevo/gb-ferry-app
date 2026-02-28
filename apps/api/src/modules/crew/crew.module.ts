import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { CrewController } from './crew.controller';
import { CrewService } from './crew.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CrewController, CertificationsController],
  providers: [CrewService, CertificationsService, VerificationService],
  exports: [CrewService, CertificationsService, VerificationService],
})
export class CrewModule {}

