import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { ACE_GATEWAY } from './ace-gateway.interface';
import { CBPController } from './cbp.controller';
import { CBPService } from './cbp.service';
import { EnoAdGateway } from './enoad.gateway';
import { MockACEGateway } from './mock-ace.gateway';

@Module({
  imports: [DatabaseModule, AuditModule, ConfigModule],
  controllers: [CBPController],
  providers: [
    CBPService,
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
  exports: [CBPService, ACE_GATEWAY],
})
export class CBPModule {}
