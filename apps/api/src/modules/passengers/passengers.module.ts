import { Module } from '@nestjs/common';
import { ManifestsController } from './manifests.controller';
import { ManifestsService } from './manifests.service';
import { PassengersController } from './passengers.controller';
import { PassengersService } from './passengers.service';

@Module({
  controllers: [PassengersController, ManifestsController],
  providers: [PassengersService, ManifestsService],
  exports: [PassengersService, ManifestsService],
})
export class PassengersModule {}
