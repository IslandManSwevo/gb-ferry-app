import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { BMAGateway } from './bma.gateway';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { CrewController } from './crew.controller';
import { CrewService } from './crew.service';
import { MockBMAGateway } from './mock-bma.gateway';
import { VERIFICATION_GATEWAY } from './verification-gateway.interface';
import { VerificationService } from './verification.service';

@Module({
  imports: [DatabaseModule, AuditModule, ConfigModule],
  controllers: [CrewController, CertificationsController],
  providers: [
    CrewService,
    CertificationsService,
    VerificationService,
    {
      provide: VERIFICATION_GATEWAY,
      useFactory: (configService: ConfigService) => {
        const useLive = configService.get<string>('BMA_LIVE') === 'true';
        if (useLive) {
          return [new BMAGateway(configService)];
        }
        return [new MockBMAGateway()];
      },
      inject: [ConfigService],
    },
  ],
  exports: [CrewService, CertificationsService, VerificationService],
})
export class CrewModule {}
