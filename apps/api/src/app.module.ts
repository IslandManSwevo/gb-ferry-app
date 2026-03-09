import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BridgeSyncModule } from './modules/bridge-sync/bridge-sync.module';
import { CBPModule } from './modules/cbp/cbp.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CrewModule } from './modules/crew/crew.module';
import { DatabaseModule } from './modules/database/database.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FleetAnalyticsModule } from './modules/fleet-analytics/fleet-analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PscModule } from './modules/psc/psc.module';
import { SecurityModule } from './modules/security/security.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';
import { VesselsModule } from './modules/vessels/vessels.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Background Tasks & Events
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),

    // Authentication (Keycloak)
    AuthModule,

    // Database
    DatabaseModule,

    // Feature modules
    SecurityModule,
    CrewModule,
    VesselsModule,
    ComplianceModule,
    CBPModule,
    DocumentsModule,
    AuditModule,
    PscModule,
    BridgeSyncModule,
    FleetAnalyticsModule,
    SettingsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
