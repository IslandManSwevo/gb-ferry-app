import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { ManifestsController } from './manifests.controller';
import { ManifestsService } from './manifests.service';
import { PassengersController } from './passengers.controller';
import { PassengersService } from './passengers.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [PassengersController, ManifestsController],
  providers: [PassengersService, ManifestsService],
  exports: [PassengersService, ManifestsService],
})
export class PassengersModule {}
