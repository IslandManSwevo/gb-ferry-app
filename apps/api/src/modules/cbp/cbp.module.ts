import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { ACE_GATEWAY } from './ace-gateway.interface';
import { CbpTransformer } from './cbp-transformer.service';
import { CBPController } from './cbp.controller';
import { CBPService } from './cbp.service';
import { EnoAdSegmentService } from './enoad-segment.service';
import { EnoAdGateway } from './enoad.gateway';
import { I418Service } from './i418.service';
import { MockACEGateway } from './mock-ace.gateway';

@Module({
  imports: [DatabaseModule, AuditModule, ConfigModule],
  controllers: [CBPController],
  providers: [
    CBPService,
    CbpTransformer,
    I418Service,
    EnoAdSegmentService,
    {
      provide: ACE_GATEWAY,
      useFactory: (configService: ConfigService) => {
        const useLive = configService.get<string>('ENOAD_LIVE') === 'true';
        if (useLive) {
          return new EnoAdGateway(configService);
        }
        return new MockACEGateway();
      },
      inject: [ConfigService],
    },
  ],
  exports: [CBPService, ACE_GATEWAY, I418Service, EnoAdSegmentService],
})
export class CBPModule {}
