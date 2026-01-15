import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { USCGService } from './uscg.service';

@Module({
  imports: [DatabaseModule],
  providers: [USCGService],
  exports: [USCGService],
})
export class USCGModule {}
