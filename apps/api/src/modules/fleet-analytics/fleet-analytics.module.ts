import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FleetAnalyticsController } from './fleet-analytics.controller';
import { FleetAnalyticsService } from './fleet-analytics.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FleetAnalyticsController],
  providers: [FleetAnalyticsService],
  exports: [FleetAnalyticsService],
})
export class FleetAnalyticsModule {}
