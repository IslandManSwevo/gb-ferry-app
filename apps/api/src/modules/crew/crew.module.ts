import { Module } from '@nestjs/common';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { CrewController } from './crew.controller';
import { CrewService } from './crew.service';

@Module({
  controllers: [CrewController, CertificationsController],
  providers: [CrewService, CertificationsService],
  exports: [CrewService, CertificationsService],
})
export class CrewModule {}
