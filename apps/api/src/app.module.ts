import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BridgeSyncModule } from './modules/bridge-sync/bridge-sync.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CrewModule } from './modules/crew/crew.module';
import { DatabaseModule } from './modules/database/database.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FleetAnalyticsModule } from './modules/fleet-analytics/fleet-analytics.module';
import { PscModule } from './modules/psc/psc.module';
import { VesselsModule } from './modules/vessels/vessels.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Authentication (Keycloak)
    AuthModule,

    // Database
    DatabaseModule,

    // Feature modules
    CrewModule,
    VesselsModule,
    ComplianceModule,
    DocumentsModule,
    AuditModule,
    PscModule,
    BridgeSyncModule,
    FleetAnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
