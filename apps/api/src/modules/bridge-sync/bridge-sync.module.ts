import { Global, Module } from '@nestjs/common';
import { BridgeCacheService } from './bridge-cache.service';
import { BridgeSyncInterceptor } from './bridge-sync.interceptor';

@Global()
@Module({
  providers: [BridgeCacheService, BridgeSyncInterceptor],
  exports: [BridgeCacheService, BridgeSyncInterceptor],
})
export class BridgeSyncModule {}
