import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { CBPService } from './cbp.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [CBPService],
  exports: [CBPService],
})
export class CBPModule {}
