import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { ACE_GATEWAY } from './ace-gateway.interface';
import { CBPController } from './cbp.controller';
import { CBPService } from './cbp.service';
import { MockACEGateway } from './mock-ace.gateway';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CBPController],
  providers: [
    CBPService,
    { provide: ACE_GATEWAY, useClass: MockACEGateway }
  ],
  exports: [CBPService, ACE_GATEWAY],
})
export class CBPModule {}
