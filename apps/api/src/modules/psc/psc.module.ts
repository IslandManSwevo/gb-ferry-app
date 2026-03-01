import { Module } from '@nestjs/common';
import { CrewModule } from '../crew/crew.module';
import { DatabaseModule } from '../database/database.module';
import { PscRiskController } from './psc-risk.controller';
import { PscRiskService } from './psc-risk.service';

@Module({
  imports: [DatabaseModule, CrewModule],
  providers: [PscRiskService],
  controllers: [PscRiskController],
  exports: [PscRiskService],
})
export class PscModule {}
